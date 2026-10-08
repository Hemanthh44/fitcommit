const { NUTRITION_DATABASE } = require('./nutritionDatabase');

/**
 * FitCommit Nutrition Resolver & Deterministic Macro Calculation Engine
 * Resolves visual AI food names to verified USDA / IFCT database items
 * and performs mathematical nutritional scaling strictly by portion weight.
 */

// Common clean-up stopwords for food names
const CLEANUP_REGEX = /\b(plate of|bowl of|portion of|serving of|approx|approximately|fresh|cooked|hot|warm|homemade|traditional|style)\b/gi;

function cleanFoodName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName
    .toLowerCase()
    .replace(CLEANUP_REGEX, '')
    .replace(/[^a-z0-9\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves raw food name and preparation style to verified nutrition entry.
 * Explicitly guards against dangerous fuzzy matching.
 */
function resolveFoodEntry(rawName, preparation = 'unknown') {
  const cleaned = cleanFoodName(rawName);
  const prep = (preparation || 'unknown').toLowerCase().trim();

  // 1. Detect Explicit Ambiguity (e.g. "paneer/tofu" or "curd/mayo")
  if (cleaned.includes('/') || cleaned.includes(' or ')) {
    const parts = cleaned.split(/\/|\bor\b/).map(p => p.trim()).filter(Boolean);
    const possibleMatches = [];
    for (const part of parts) {
      const match = findDirectMatch(part, prep);
      if (match && !possibleMatches.some(m => m.id === match.id)) {
        possibleMatches.push(match);
      }
    }

    if (possibleMatches.length > 0) {
      return {
        matched: false,
        requires_confirmation: true,
        reason: 'Ambiguous food identity detected from visual analysis.',
        possible_matches: possibleMatches.map(formatResolvedItemSummary)
      };
    }
  }

  // 2. Direct exact or alias lookup
  const match = findDirectMatch(cleaned, prep);
  if (match) {
    return {
      matched: true,
      requires_confirmation: false,
      entry: match
    };
  }

  // 3. Preparation-fallback matching
  // (e.g. if AI says "chicken" and prep is "curry" -> map to chicken curry)
  if (cleaned.includes('chicken') && (prep === 'curry' || cleaned.includes('curry') || cleaned.includes('gravy'))) {
    const chickenCurry = NUTRITION_DATABASE.find(e => e.id === 'ifct_chicken_curry');
    if (chickenCurry) return { matched: true, requires_confirmation: false, entry: chickenCurry };
  }

  if (cleaned.includes('chicken') && (cleaned.includes('biryani') || prep === 'cooked')) {
    if (cleaned.includes('biryani')) {
      const biryani = NUTRITION_DATABASE.find(e => e.id === 'ifct_chicken_biryani');
      if (biryani) return { matched: true, requires_confirmation: false, entry: biryani };
    }
  }

  if (cleaned.includes('potato')) {
    if (prep === 'deep_fried' || prep === 'fried' || cleaned.includes('fried') || cleaned.includes('fries')) {
      const friedPot = NUTRITION_DATABASE.find(e => e.id === 'usda_potato_fried');
      if (friedPot) return { matched: true, requires_confirmation: false, entry: friedPot };
    } else {
      const boiledPot = NUTRITION_DATABASE.find(e => e.id === 'usda_potato_boiled');
      if (boiledPot) return { matched: true, requires_confirmation: false, entry: boiledPot };
    }
  }

  // 4. Word boundary token match (safe matching without false positives)
  const tokens = cleaned.split(' ').filter(t => t.length > 2);
  let candidateMatches = [];

  for (const item of NUTRITION_DATABASE) {
    const itemTokens = item.name.toLowerCase().split(' ');
    const hasMainToken = tokens.some(t => itemTokens.includes(t) || item.aliases.some(a => a.toLowerCase().includes(t)));
    if (hasMainToken) {
      candidateMatches.push(item);
    }
  }

  if (candidateMatches.length === 1) {
    return {
      matched: true,
      requires_confirmation: false,
      entry: candidateMatches[0]
    };
  } else if (candidateMatches.length > 1) {
    return {
      matched: false,
      requires_confirmation: true,
      reason: 'Multiple verified foods match this visual description.',
      possible_matches: candidateMatches.slice(0, 4).map(formatResolvedItemSummary)
    };
  }

  // 5. Unmatched
  return {
    matched: false,
    requires_confirmation: true,
    reason: 'Food not found in verified nutrition database.',
    possible_matches: []
  };
}

const PREP_WORDS_REGEX = /\b(grilled|boiled|fried|deep-fried|deep_fried|roasted|steamed|baked|raw|pan-seared|pan_fried|pan fried|seasoned|diced|sliced|chopped|shredded|mashed|stir-fried|sauteed|sautéed|peeled|cooked|fresh)\b/gi;

function findDirectMatch(cleanedName, preparation) {
  if (!cleanedName) return null;

  const withoutPrep = cleanedName.replace(PREP_WORDS_REGEX, '').replace(/\s+/g, ' ').trim();
  const singular = cleanedName.endsWith('s') && !cleanedName.endsWith('ss') ? cleanedName.slice(0, -1) : cleanedName;
  const singularNoPrep = withoutPrep.endsWith('s') && !withoutPrep.endsWith('ss') ? withoutPrep.slice(0, -1) : withoutPrep;

  const candidateForms = [cleanedName, singular, withoutPrep, singularNoPrep].filter(Boolean);

  // 1. Check exact canonical name match across forms
  for (const form of candidateForms) {
    for (const item of NUTRITION_DATABASE) {
      if (item.name.toLowerCase() === form) {
        return item;
      }
    }
  }

  // 2. Check alias list across forms
  for (const form of candidateForms) {
    for (const item of NUTRITION_DATABASE) {
      if (item.aliases.some(alias => alias.toLowerCase() === form)) {
        return item;
      }
    }
  }

  return null;
}

function formatResolvedItemSummary(item) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    calories_per_100g: item.calories,
    protein_g_per_100g: item.protein_g,
    carbs_g_per_100g: item.carbs_g,
    fat_g_per_100g: item.fat_g,
    fiber_g_per_100g: item.fiber_g,
    source: item.source,
    source_id: item.source_id
  };
}

/**
 * Deterministic mathematical calculation of nutritional values strictly based on portion in grams
 * Formula: value = (per_100g_value * quantity_g) / 100
 */
function calculateDeterministicNutrition(entry, quantity_g) {
  const g = Math.max(1, Number(quantity_g) || 100);
  const factor = g / 100;

  return {
    calories: Math.round(entry.calories * factor),
    protein_g: Math.round((entry.protein_g * factor) * 10) / 10,
    carbs_g: Math.round((entry.carbs_g * factor) * 10) / 10,
    fat_g: Math.round((entry.fat_g * factor) * 10) / 10,
    fiber_g: Math.round((entry.fiber_g * factor) * 10) / 10,
    serving_g: g,
    per_100g: {
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
      fiber_g: entry.fiber_g,
      source: entry.source,
      source_id: entry.source_id
    }
  };
}

/**
 * Searches verified nutrition database by keyword for manual search & autocomplete
 */
function searchNutritionDatabase(query) {
  if (!query || typeof query !== 'string') {
    return NUTRITION_DATABASE.slice(0, 25).map(formatResolvedItemSummary);
  }

  const q = query.toLowerCase().trim();
  const results = NUTRITION_DATABASE.filter(item => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.aliases.some(alias => alias.toLowerCase().includes(q))
    );
  });

  return results.slice(0, 20).map(formatResolvedItemSummary);
}

/**
 * Sums all individual food macro items mathematically
 */
function calculateAggregateTotals(foods) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (Number(f.nutrition?.calories || f.calories) || 0),
      protein_g: Math.round((acc.protein_g + (Number(f.nutrition?.protein_g || f.protein_g) || 0)) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + (Number(f.nutrition?.carbs_g || f.carbs_g) || 0)) * 10) / 10,
      fat_g: Math.round((acc.fat_g + (Number(f.nutrition?.fat_g || f.fat_g) || 0)) * 10) / 10,
      fiber_g: Math.round((acc.fiber_g + (Number(f.nutrition?.fiber_g || f.fiber_g) || 0)) * 10) / 10
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );
}

module.exports = {
  resolveFoodEntry,
  calculateDeterministicNutrition,
  calculateAggregateTotals,
  searchNutritionDatabase,
  formatResolvedItemSummary
};
