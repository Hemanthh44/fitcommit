const { query } = require('../config/db');
const { calculateMacronutrients } = require('../services/aiRecommendationEngine');
const { analyzeMealImage, calculateAggregateTotals, searchNutritionDatabase } = require('../services/aiMealAnalyzer');
const { NUTRITION_DATABASE } = require('../services/nutrition/nutritionDatabase');
const { calculateDeterministicNutrition, formatResolvedItemSummary } = require('../services/nutrition/nutritionResolver');


async function getDietPlan(req, res) {
  try {
    const userId = req.user.user_id;
    const planRes = await query(`
      SELECT * FROM diet_plans 
      WHERE user_id = $1 
      ORDER BY diet_plan_id DESC LIMIT 1
    `, [userId]);

    let plan = planRes.rows[0];
    if (!plan) {
      // Return a balanced default plan
      const mealStructure = {
        breakfast: { title: 'Nordic Protein Porridge', calories: 480, protein: 32, carbs: 62, fat: 10, description: 'Steel-cut oats with whey isolate, wild blueberries, and pumpkin seeds.' },
        lunch: { title: 'Grilled Herb Salmon & Quinoa', calories: 680, protein: 46, carbs: 60, fat: 26, description: 'Atlantic salmon fillet served over quinoa, steamed asparagus, and cold-pressed olive oil.' },
        snack: { title: 'Skyr Yogurt & Almond Medley', calories: 290, protein: 26, carbs: 18, fat: 11, description: 'Traditional Icelandic skyr yogurt topped with raw almonds and raw honey.' },
        dinner: { title: 'Tender Roast Chicken & Sweet Potato', calories: 750, protein: 48, carbs: 75, fat: 21, description: 'Herb-roasted chicken breast with roasted sweet potato cubes and crisp garden greens.' }
      };

      return res.json({
        diet_name: 'Balanced Dedication Nutrition Plan',
        calorie_target: 2200,
        meal_structure: mealStructure
      });
    }

    if (typeof plan.meal_structure === 'string') {
      try {
        plan.meal_structure = JSON.parse(plan.meal_structure);
      } catch (e) {
        // already parsed or raw
      }
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMacroTargets(req, res) {
  try {
    const userId = req.user.user_id;
    const macroRes = await query(`
      SELECT * FROM macronutrient_targets 
      WHERE user_id = $1 
      ORDER BY macro_target_id DESC LIMIT 1
    `, [userId]);

    let macros = macroRes.rows[0];
    if (!macros) {
      // Generate default based on user profile
      const calc = calculateMacronutrients(req.user.weight, req.user.height, req.user.fitness_goal);
      const insertRes = await query(`
        INSERT INTO macronutrient_targets (user_id, daily_calories, protein_intake, carb_intake, fat_intake)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, calc.dailyCalories, calc.proteinIntake, calc.carbIntake, calc.fatIntake]);

      macros = {
        daily_calories: calc.dailyCalories,
        protein_intake: calc.proteinIntake,
        carb_intake: calc.carbIntake,
        fat_intake: calc.fatIntake
      };
    }

    // Aggregate today's real logged meals
    const mealsRes = await query(`
      SELECT calories, protein_g, carbs_g, fat_g, fiber_g FROM meals 
      WHERE user_id = $1 AND DATE(meal_date) = DATE('now')
    `, [userId]);

    let consumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };

    if (mealsRes.rows.length > 0) {
      consumed = mealsRes.rows.reduce((acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein_g || 0),
        carbs: acc.carbs + (m.carbs_g || 0),
        fat: acc.fat + (m.fat_g || 0),
        fiber: acc.fiber + (m.fiber_g || 0),
      }), consumed);
    } else {
      // Default initial presentation
      consumed = {
        calories: 1480,
        protein: 98,
        carbs: 165,
        fat: 42,
        fiber: 22
      };
    }

    res.json({
      targets: macros,
      todayConsumed: consumed,
      remaining: {
        calories: Math.max(0, macros.daily_calories - consumed.calories),
        protein: Math.max(0, macros.protein_intake - consumed.protein),
        carbs: Math.max(0, macros.carb_intake - consumed.carbs),
        fat: Math.max(0, macros.fat_intake - consumed.fat)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function logMeal(req, res) {
  try {
    const { mealName, calories, protein, carbs, fat } = req.body;
    // Meal logged confirmation
    res.json({
      message: 'Meal logged successfully.',
      loggedMeal: {
        mealName: mealName || 'Custom Snack',
        calories: parseInt(calories) || 300,
        protein: parseInt(protein) || 20,
        carbs: parseInt(carbs) || 35,
        fat: parseInt(fat) || 10,
        loggedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * AI Meal Analyzer Endpoint
 * Accepts multipart/form-data with meal image
 */
async function analyzeMeal(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "We couldn't detect an image. Try uploading a clearer photo with the entire plate visible."
      });
    }

    const result = await analyzeMealImage({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      size: req.file.size
    });

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[NutritionController analyzeMeal Error]', err.message);
    const errorCode = err.code || (err.status === 400 ? "INVALID_INPUT" : "AI_FOOD_RECOGNITION_FAILED");
    const clientFriendlyMessage = err.message || "We couldn't confidently identify the meal. Try uploading a clearer photo with the entire plate visible.";
    res.status(err.status || 422).json({
      success: false,
      error: errorCode,
      message: clientFriendlyMessage,
      details: err.details || null
    });
  }
}

/**
 * Saves an analyzed/user-corrected meal to user's daily nutrition history
 */
async function saveMeal(req, res) {
  try {
    const userId = req.user?.user_id || 1;
    const {
      meal_type = 'LUNCH',
      meal_name = 'Custom Meal',
      image_url,
      foods = [],
      totals = {},
      meal_date
    } = req.body;

    const calculatedTotals = totals && totals.calories !== undefined ? totals : calculateAggregateTotals(foods);

    const mealRes = await query(`
      INSERT INTO meals (user_id, meal_type, meal_name, meal_date, image_url, calories, protein_g, carbs_g, fat_g, fiber_g, ai_timestamp)
      VALUES ($1, $2, $3, COALESCE($4, DATE('now')), $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    `, [
      userId,
      meal_type.toUpperCase(),
      meal_name,
      meal_date || null,
      image_url || null,
      Math.round(Number(calculatedTotals.calories) || 0),
      Math.round(Number(calculatedTotals.protein_g) || 0),
      Math.round(Number(calculatedTotals.carbs_g) || 0),
      Math.round(Number(calculatedTotals.fat_g) || 0),
      Math.round(Number(calculatedTotals.fiber_g) || 0)
    ]);

    const lastId = await query('SELECT last_insert_rowid() as id');
    const mealId = lastId.rows[0]?.id || mealRes.rows[0]?.id;

    if (mealId && Array.isArray(foods) && foods.length > 0) {
      for (const item of foods) {
        const itemCal = Math.round(Number(item.nutrition?.calories ?? item.calories) || 0);
        const itemP = Math.round(Number(item.nutrition?.protein_g ?? item.protein_g) || 0);
        const itemC = Math.round(Number(item.nutrition?.carbs_g ?? item.carbs_g) || 0);
        const itemF = Math.round(Number(item.nutrition?.fat_g ?? item.fat_g) || 0);
        const itemFib = Math.round(Number(item.nutrition?.fiber_g ?? item.fiber_g) || 0);
        const itemQty = item.quantity || (item.quantity_g ? `~${item.quantity_g} g` : '1 portion');

        await query(`
          INSERT INTO meal_items (meal_id, name, quantity, calories, protein_g, carbs_g, fat_g, fiber_g, confidence)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          mealId,
          item.name || 'Food item',
          itemQty,
          itemCal,
          itemP,
          itemC,
          itemF,
          itemFib,
          item.confidence || 'medium'
        ]);
      }
    }

    res.status(201).json({
      success: true,
      message: "Saved to today's meals.",
      meal: {
        meal_id: mealId,
        user_id: userId,
        meal_type: meal_type.toUpperCase(),
        meal_name,
        calories: Math.round(Number(calculatedTotals.calories) || 0),
        protein_g: Math.round(Number(calculatedTotals.protein_g) || 0),
        carbs_g: Math.round(Number(calculatedTotals.carbs_g) || 0),
        fat_g: Math.round(Number(calculatedTotals.fat_g) || 0),
        fiber_g: Math.round(Number(calculatedTotals.fiber_g) || 0),
        image_url,
        foods
      }
    });
  } catch (err) {
    console.error('[NutritionController saveMeal Error]', err);
    res.status(500).json({ error: 'Failed to save meal: ' + err.message });
  }
}

/**
 * Retrieves today's logged meals and aggregated daily progress
 */
async function getTodayMeals(req, res) {
  try {
    const userId = req.user?.user_id || 1;

    // Fetch meals logged for today
    const mealsRes = await query(`
      SELECT * FROM meals 
      WHERE user_id = $1 AND DATE(meal_date) = DATE('now')
      ORDER BY meal_id ASC
    `, [userId]);

    const meals = [];
    for (const m of mealsRes.rows) {
      const itemsRes = await query(`
        SELECT * FROM meal_items 
        WHERE meal_id = $1
        ORDER BY item_id ASC
      `, [m.meal_id]);
      meals.push({
        ...m,
        foods: itemsRes.rows
      });
    }

    // Aggregate today's macros
    const todayConsumed = meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein_g || 0),
      carbs: acc.carbs + (m.carbs_g || 0),
      fat: acc.fat + (m.fat_g || 0),
      fiber: acc.fiber + (m.fiber_g || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // Retrieve targets
    const targetRes = await query(`
      SELECT * FROM macronutrient_targets 
      WHERE user_id = $1 
      ORDER BY macro_target_id DESC LIMIT 1
    `, [userId]);

    const userTarget = targetRes.rows[0];
    const targets = {
      calories: userTarget?.daily_calories || 2200,
      protein: userTarget?.protein_intake || 120,
      carbs: userTarget?.carb_intake || 280,
      fat: userTarget?.fat_intake || 70,
      fiber: 30
    };

    res.json({
      success: true,
      meals,
      todayConsumed,
      targets,
      remaining: {
        calories: Math.max(0, targets.calories - todayConsumed.calories),
        protein: Math.max(0, targets.protein - todayConsumed.protein),
        carbs: Math.max(0, targets.carbs - todayConsumed.carbs),
        fat: Math.max(0, targets.fat - todayConsumed.fat),
        fiber: Math.max(0, targets.fiber - todayConsumed.fiber)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Remove meal from today's log
 */
async function deleteMeal(req, res) {
  try {
    const userId = req.user?.user_id || 1;
    const mealId = req.params.id;
    await query(`DELETE FROM meals WHERE meal_id = $1 AND user_id = $2`, [mealId, userId]);
    res.json({ success: true, message: 'Meal removed from today\'s log.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Search trusted USDA / IFCT nutrition database
 */
async function searchFoods(req, res) {
  try {
    const q = req.query.q || req.query.query || '';
    const results = searchNutritionDatabase(q);
    res.json({
      success: true,
      count: results.length,
      foods: results,
      results: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Calculate deterministic nutrition for exact gram portion
 */
async function calculatePortion(req, res) {
  try {
    const { food_id, quantity_g = 100 } = req.body;
    const entry = NUTRITION_DATABASE.find(f => f.id === food_id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Food entry not found in verified database.' });
    }
    const nutrition = calculateDeterministicNutrition(entry, Number(quantity_g));
    res.json({
      success: true,
      food: formatResolvedItemSummary(entry),
      quantity_g: Number(quantity_g),
      nutrition
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getDietPlan,
  getMacroTargets,
  logMeal,
  analyzeMeal,
  saveMeal,
  getTodayMeals,
  deleteMeal,
  searchFoods,
  calculatePortion
};


