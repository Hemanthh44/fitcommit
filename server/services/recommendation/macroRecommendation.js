/**
 * Macronutrient & Energy Expenditure Recommendation Service
 * Evaluates Mifflin-St Jeor Basal Metabolic Rate and macronutrient gram partitions
 * Aligned with ACSM & ISSN evidence-based sports nutrition guidelines
 */

const { NON_MEDICAL_DISCLAIMER, normalizeUserContext } = require('./types');

/**
 * Calculates BMI with World Health Organization classifications
 */
function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = +(weightKg / (heightM * heightM)).toFixed(2);
  let category = 'Normal Weight';
  let riskIndicator = 'Low (Healthy Range)';

  if (bmi < 18.5) {
    category = 'Underweight';
    riskIndicator = 'Elevated nutritional deficiency risk';
  } else if (bmi >= 25 && bmi < 29.9) {
    category = 'Overweight';
    riskIndicator = 'Mild metabolic strain';
  } else if (bmi >= 30 && bmi < 34.9) {
    category = 'Obese (Class I)';
    riskIndicator = 'Moderate cardiovascular & metabolic strain';
  } else if (bmi >= 35) {
    category = 'Obese (Class II/III)';
    riskIndicator = 'Substantial metabolic strain';
  }

  return {
    bmi_value: bmi,
    category,
    risk_indicator: riskIndicator,
    healthy_weight_range_kg: {
      min: +(18.5 * heightM * heightM).toFixed(1),
      max: +(24.9 * heightM * heightM).toFixed(1)
    }
  };
}

/**
 * Calculates evidence-based macronutrient targets
 */
function recommendMacronutrients(rawContext) {
  const ctx = normalizeUserContext(rawContext);
  const { weight_kg, height_cm, age, gender, fitness_goal, activity_level } = ctx;

  // 1. BMI assessment
  const bmiData = calculateBMI(weight_kg, height_cm);

  // 2. Mifflin-St Jeor BMR Formula
  // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
  // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = Math.round(bmr * activity_level);

  // 3. Goal-specific caloric targets & protein intake (g/kg)
  let targetCalories = tdee;
  let proteinPerKg = 1.8;
  let caloricAdjustmentRationale = '';

  switch (fitness_goal) {
    case 'Muscle Gain':
      // Moderate hypercaloric surplus (+300 to +350 kcal) to maximize protein synthesis with minimal fat gain
      targetCalories = tdee + 350;
      proteinPerKg = 2.0;
      caloricAdjustmentRationale = 'Moderate caloric surplus (+350 kcal) to facilitate muscle protein synthesis and glycogen re-synthesis.';
      break;

    case 'Fat Loss':
      // Moderate hypocaloric deficit (-450 kcal), maintaining safe minimum (>1300 kcal)
      targetCalories = Math.max(1300, tdee - 450);
      proteinPerKg = 2.2; // Elevated protein to preserve lean muscle mass during deficit
      caloricAdjustmentRationale = 'Controlled hypocaloric deficit (-450 kcal) paired with elevated protein (2.2g/kg) to protect lean tissue.';
      break;

    case 'Strength':
      targetCalories = tdee + 200;
      proteinPerKg = 2.0;
      caloricAdjustmentRationale = 'Slight positive energy balance (+200 kcal) for maximal motor unit recruitment and connective tissue recovery.';
      break;

    case 'Endurance':
      targetCalories = tdee + 250;
      proteinPerKg = 1.6;
      caloricAdjustmentRationale = 'Glycogen replenishment focus (+250 kcal) with prioritized carbohydrate density for prolonged stamina.';
      break;

    default: // General Fitness
      targetCalories = tdee;
      proteinPerKg = 1.8;
      caloricAdjustmentRationale = 'Iso-caloric maintenance targeting body recomposition and cardiovascular conditioning.';
  }

  // 4. Macronutrient Partitioning
  // Protein (4 kcal/g)
  const proteinGrams = Math.round(weight_kg * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Fat: 26-28% of total calories (9 kcal/g) for endocrine health
  const fatPercentage = 0.28;
  const fatCalories = Math.round(targetCalories * fatPercentage);
  const fatGrams = Math.round(fatCalories / 9);

  // Carbohydrates: Remaining energy (4 kcal/g)
  const remainingCalories = Math.max(200, targetCalories - (proteinCalories + fatCalories));
  const carbGrams = Math.round(remainingCalories / 4);
  const carbCalories = carbGrams * 4;

  // 5. Hydration baseline
  const dailyWaterMl = Math.round(weight_kg * 35); // 35 ml/kg baseline

  return {
    biometrics: {
      height_cm,
      weight_kg,
      bmi: bmiData.bmi_value,
      bmi_category: bmiData.category,
      healthy_range: bmiData.healthy_weight_range_kg
    },
    energy_expenditure: {
      bmr_kcal: Math.round(bmr),
      tdee_kcal: tdee,
      target_daily_calories: targetCalories,
      caloric_delta: targetCalories - tdee,
      rationale: caloricAdjustmentRationale
    },
    macronutrients: {
      protein: {
        grams: proteinGrams,
        calories: proteinCalories,
        percentage_of_intake: +((proteinCalories / targetCalories) * 100).toFixed(1),
        grams_per_kg: proteinPerKg
      },
      carbohydrates: {
        grams: carbGrams,
        calories: carbCalories,
        percentage_of_intake: +((carbCalories / targetCalories) * 100).toFixed(1)
      },
      fats: {
        grams: fatGrams,
        calories: fatCalories,
        percentage_of_intake: +((fatCalories / targetCalories) * 100).toFixed(1)
      }
    },
    hydration: {
      recommended_water_ml: dailyWaterMl,
      recommended_liters: +(dailyWaterMl / 1000).toFixed(1),
      per_workout_addition_ml: 500
    },
    disclaimer: NON_MEDICAL_DISCLAIMER
  };
}

module.exports = {
  calculateBMI,
  recommendMacronutrients
};
