/**
 * Diet Recommendation & Meal Planning Engine
 * Generates tailored meal allocations based on dietary preferences and fitness goals
 * Aligned with SRS Requirements F6, F15, U5, U10
 */

const { NON_MEDICAL_DISCLAIMER, normalizeUserContext } = require('./types');
const { recommendMacronutrients } = require('./macroRecommendation');

/**
 * Curated Meal Templates by Dietary Preference
 */
const MEAL_DATABASE = {
  Omnivore: {
    breakfast: {
      title: 'Nordic Oats & Scrambled Eggs',
      items: ['Rolled oats with blueberries and chia seeds', '3 free-range eggs + 2 egg whites', 'Black coffee or green tea'],
      protein_ratio: 0.25,
      carbs_ratio: 0.30,
      fat_ratio: 0.25
    },
    lunch: {
      title: 'Herb-Roasted Chicken Breast & Quinoa',
      items: ['Grilled chicken breast (200g)', 'Steamed tricolor quinoa (150g)', 'Baby spinach, cherry tomatoes & extra virgin olive oil'],
      protein_ratio: 0.35,
      carbs_ratio: 0.35,
      fat_ratio: 0.25
    },
    pre_workout: {
      title: 'Fast-Acting Glycogen Primer',
      items: ['Large ripe banana', 'Rice cake with almond butter (1 tbsp)', 'Electrolyte water'],
      protein_ratio: 0.05,
      carbs_ratio: 0.15,
      fat_ratio: 0.15
    },
    dinner: {
      title: 'Baked Norwegian Salmon & Sweet Potato',
      items: ['Wild-caught salmon fillet (180g)', 'Roasted sweet potato cubes (200g)', 'Steamed broccoli and asparagus with sea salt'],
      protein_ratio: 0.30,
      carbs_ratio: 0.20,
      fat_ratio: 0.35
    },
    snack: {
      title: 'Evening Casein Recovery Bowl',
      items: ['Low-fat Skyr / Greek yogurt (200g)', 'Handful of crushed walnuts', 'Dash of cinnamon'],
      protein_ratio: 0.05,
      carbs_ratio: 0.00,
      fat_ratio: 0.00
    }
  },
  Vegetarian: {
    breakfast: {
      title: 'Icelandic Skyr & Spiced Granola',
      items: ['High-protein Icelandic Skyr (250g)', 'Nut & seed granola with freeze-dried berries', 'Fresh sliced banana'],
      protein_ratio: 0.25,
      carbs_ratio: 0.30,
      fat_ratio: 0.20
    },
    lunch: {
      title: 'Paneer / Tofu Tikka Bowl with Brown Rice',
      items: ['Low-fat grilled paneer or firm tofu (180g)', 'Brown basmati rice (160g)', 'Spiced chickpea salad with lemon vinaigrette'],
      protein_ratio: 0.35,
      carbs_ratio: 0.35,
      fat_ratio: 0.30
    },
    pre_workout: {
      title: 'Medjool Dates & Peanut Butter',
      items: ['3 Medjool dates', 'Natural peanut butter (15g)', 'Black filter coffee'],
      protein_ratio: 0.05,
      carbs_ratio: 0.15,
      fat_ratio: 0.15
    },
    dinner: {
      title: 'Lentil Dal & Roasted Tempeh Hash',
      items: ['Yellow lentil & spinach dal (250ml)', 'Pan-seared spiced tempeh (150g)', 'Steamed broccoli and roasted carrots'],
      protein_ratio: 0.30,
      carbs_ratio: 0.20,
      fat_ratio: 0.35
    },
    snack: {
      title: 'Cottage Cheese & Mixed Berries',
      items: ['Cultured cottage cheese (180g)', 'Blackberries and pumpkin seeds'],
      protein_ratio: 0.05,
      carbs_ratio: 0.00,
      fat_ratio: 0.00
    }
  },
  Vegan: {
    breakfast: {
      title: 'Plant Protein Overnight Chia Pudding',
      items: ['Soy / Pea protein isolate (30g) in oat milk', 'Chia seeds, hemp hearts and blueberries', 'Cacao nibs'],
      protein_ratio: 0.25,
      carbs_ratio: 0.25,
      fat_ratio: 0.25
    },
    lunch: {
      title: 'Seitan & Edamame Quinoa Power Bowl',
      items: ['High-protein organic seitan (150g)', 'Steamed edamame beans (80g)', 'Fluffy quinoa with tahini-lemon dressing'],
      protein_ratio: 0.35,
      carbs_ratio: 0.40,
      fat_ratio: 0.25
    },
    pre_workout: {
      title: 'Banana & Salted Rice Cakes',
      items: ['2 multigrain rice cakes', '1 medium banana', 'Hydration electrolyte mix'],
      protein_ratio: 0.05,
      carbs_ratio: 0.15,
      fat_ratio: 0.10
    },
    dinner: {
      title: 'Crispy Smoked Tofu Stir-Fry',
      items: ['Extra-firm smoked tofu (220g)', 'Broccoli florets, bell peppers and bok choy', 'Brown jasmine rice with sesame seeds'],
      protein_ratio: 0.30,
      carbs_ratio: 0.20,
      fat_ratio: 0.40
    },
    snack: {
      title: 'Pumpkin Seed & Roasted Chickpea Crunch',
      items: ['Air-fried spiced chickpeas (60g)', 'Raw pumpkin seeds (20g)'],
      protein_ratio: 0.05,
      carbs_ratio: 0.00,
      fat_ratio: 0.00
    }
  },
  Pescatarian: {
    breakfast: {
      title: 'Smoked Trout / Salmon & Poached Eggs',
      items: ['Smoked trout slices (80g)', '2 poached free-range eggs on sourdough', 'Sliced avocado and watercress'],
      protein_ratio: 0.30,
      carbs_ratio: 0.25,
      fat_ratio: 0.30
    },
    lunch: {
      title: 'Mediterranean Tuna & White Bean Salad',
      items: ['Chunk light tuna in spring water (180g)', 'Cannellini beans (150g)', 'Kalamata olives, cucumber, red onion & lemon vinaigrette'],
      protein_ratio: 0.35,
      carbs_ratio: 0.35,
      fat_ratio: 0.25
    },
    pre_workout: {
      title: 'Oat Energy Bites with Honey',
      items: ['Raw rolled oats rolled with honey and chia (40g)', '1 green apple'],
      protein_ratio: 0.05,
      carbs_ratio: 0.20,
      fat_ratio: 0.10
    },
    dinner: {
      title: 'Pan-Seared White Cod & Roasted Potatoes',
      items: ['Atlantic cod fillet (220g)', 'Rosemary roasted fingerling potatoes (180g)', 'Grilled zucchini and blistered cherry tomatoes'],
      protein_ratio: 0.30,
      carbs_ratio: 0.20,
      fat_ratio: 0.35
    },
    snack: {
      title: 'Greek Yogurt with Crushed Walnuts',
      items: ['0% fat Greek yogurt (180g)', 'Handful of raw walnuts'],
      protein_ratio: 0.00,
      carbs_ratio: 0.00,
      fat_ratio: 0.00
    }
  }
};

/**
 * Recommends complete daily diet plan
 */
function recommendDiet(rawContext) {
  const ctx = normalizeUserContext(rawContext);
  const macroData = recommendMacronutrients(rawContext);

  const { dietary_preference, fitness_goal } = ctx;
  const targetCalories = macroData.energy_expenditure.target_daily_calories;
  const totalProtein = macroData.macronutrients.protein.grams;
  const totalCarbs = macroData.macronutrients.carbohydrates.grams;
  const totalFats = macroData.macronutrients.fats.grams;

  // Select meal database based on preference
  const prefKey = MEAL_DATABASE[dietary_preference] ? dietary_preference : 'Omnivore';
  const baseMeals = MEAL_DATABASE[prefKey];

  // Distribute macros across meals with gram allocations
  const mealStructure = {
    breakfast: {
      ...baseMeals.breakfast,
      calories: Math.round(targetCalories * 0.26),
      protein_g: Math.round(totalProtein * baseMeals.breakfast.protein_ratio),
      carbs_g: Math.round(totalCarbs * baseMeals.breakfast.carbs_ratio),
      fat_g: Math.round(totalFats * baseMeals.breakfast.fat_ratio)
    },
    lunch: {
      ...baseMeals.lunch,
      calories: Math.round(targetCalories * 0.34),
      protein_g: Math.round(totalProtein * baseMeals.lunch.protein_ratio),
      carbs_g: Math.round(totalCarbs * baseMeals.lunch.carbs_ratio),
      fat_g: Math.round(totalFats * baseMeals.lunch.fat_ratio)
    },
    pre_workout: {
      ...baseMeals.pre_workout,
      calories: Math.round(targetCalories * 0.10),
      protein_g: Math.round(totalProtein * baseMeals.pre_workout.protein_ratio),
      carbs_g: Math.round(totalCarbs * baseMeals.pre_workout.carbs_ratio),
      fat_g: Math.round(totalFats * baseMeals.pre_workout.fat_ratio)
    },
    dinner: {
      ...baseMeals.dinner,
      calories: Math.round(targetCalories * 0.25),
      protein_g: Math.round(totalProtein * baseMeals.dinner.protein_ratio),
      carbs_g: Math.round(totalCarbs * baseMeals.dinner.carbs_ratio),
      fat_g: Math.round(totalFats * baseMeals.dinner.fat_ratio)
    },
    snack: {
      ...baseMeals.snack,
      calories: Math.round(targetCalories * 0.05),
      protein_g: Math.max(10, Math.round(totalProtein * 0.05)),
      carbs_g: Math.max(5, Math.round(totalCarbs * 0.05)),
      fat_g: Math.max(2, Math.round(totalFats * 0.05))
    }
  };

  return {
    plan_name: `Tailored ${prefKey} Nutrition Protocol`,
    dietary_preference: prefKey,
    fitness_goal,
    energy_targets: macroData.energy_expenditure,
    macronutrient_distribution: macroData.macronutrients,
    hydration_guideline: macroData.hydration,
    meal_structure: mealStructure,
    nutrient_timing_guidelines: [
      'Consume 25-35g of complete protein every 3.5 to 4.5 hours to sustain muscle protein synthesis.',
      'Prioritize complex low-glycemic carbohydrates 2 hours before training, followed by fast-acting carbohydrates post-workout.',
      'Hydrate with minimum 500ml water upon waking to offset nocturnal fluid depletion.'
    ],
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

module.exports = {
  recommendDiet
};
