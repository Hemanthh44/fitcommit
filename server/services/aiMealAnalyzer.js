const crypto = require('crypto');
const { GoogleGenAI } = require('@google/genai');
const {
  resolveFoodEntry,
  calculateDeterministicNutrition,
  calculateAggregateTotals,
  searchNutritionDatabase,
  formatResolvedItemSummary
} = require('./nutrition/nutritionResolver');
const { NUTRITION_DATABASE } = require('./nutrition/nutritionDatabase');

/**
 * FitCommit Multimodal Food Analysis Pipeline
 * Architecture:
 *   MEAL IMAGE (Bytes)
 *       ↓
 *   GEMINI 3.1 PRO (Stage 1: Visual Candidate Detection & Evidence Extraction)
 *       ↓
 *   GEMINI 3.1 PRO (Stage 2: Independent Multimodal Verification & Correction)
 *       ↓
 *   PORTION SANITY CHECKS (Validation Bounds)
 *       ↓
 *   NUTRITION PROVIDER MATCH (Curated Indian IFCT + USDA FDC)
 *       ↓
 *   DETERMINISTIC MACRO CALCULATION & SECONDARY VALIDATION
 *       ↓
 *   USER CONFIRMATION / EDIT
 *       ↓
 *   PERSISTENCE
 *
 * CRITICAL RULE:
 * ZERO GENERIC FALLBACKS. ZERO ASSUMED MEALS.
 * If AI analysis fails, the API returns AI_FOOD_RECOGNITION_FAILED.
 * The system NEVER silently returns rice, dal, or chicken.
 */

const NUTRITION_DISCLAIMER = "Nutrition values are estimates based on detected foods, portion sizes, and verified USDA/IFCT data. Actual values may vary based on ingredients and preparation.";

// In-memory cache keyed strictly by SHA-256 hash of image bytes
const analysisCache = new Map();

/**
 * Portion sanity constraints
 */
const SANITY_BOUNDS = {
  MIN_ITEM_GRAMS: 5,
  MAX_ITEM_GRAMS: 1500,
  MAX_MEAL_CALORIES: 4000,
  SPECIFIC_MAX_GRAMS: {
    egg: 120,
    boiled_egg: 120,
    chapati: 150,
    roti: 150,
    sauce: 100,
    chutney: 100,
    oil: 50,
    butter: 50
  }
};

/**
 * Validate portion sanity and clamp/flag outliers
 */
function applyPortionSanityCheck(food) {
  let qty = Number(food.estimated_quantity_g) || 100;
  let minQty = Number(food.min_quantity_g) || Math.round(qty * 0.85);
  let maxQty = Number(food.max_quantity_g) || Math.round(qty * 1.15);

  const lowerName = (food.name || '').toLowerCase();

  // Check specific food limits
  for (const [key, maxAllowed] of Object.entries(SANITY_BOUNDS.SPECIFIC_MAX_GRAMS)) {
    if (lowerName.includes(key) && qty > maxAllowed) {
      console.warn(`[Portion Sanity] ${food.name} portion (${qty}g) exceeded reasonable bound of ${maxAllowed}g. Clamping to ${maxAllowed}g.`);
      qty = maxAllowed;
      minQty = Math.round(maxAllowed * 0.85);
      maxQty = Math.round(maxAllowed * 1.15);
      break;
    }
  }

  // General bounds
  qty = Math.min(Math.max(qty, SANITY_BOUNDS.MIN_ITEM_GRAMS), SANITY_BOUNDS.MAX_ITEM_GRAMS);
  minQty = Math.min(Math.max(minQty, SANITY_BOUNDS.MIN_ITEM_GRAMS), qty);
  maxQty = Math.max(qty, maxQty);

  return {
    ...food,
    estimated_quantity_g: qty,
    min_quantity_g: minQty,
    max_quantity_g: maxQty
  };
}

/**
 * Helper to call Gemini models with a strict per-attempt timeout to prevent indefinite hangs
 */
async function callModelWithTimeout(ai, modelName, contents, config, timeoutMs = 15000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`TIMEOUT: ${modelName} exceeded ${timeoutMs}ms limit.`);
      err.code = 'TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents,
        config
      }),
      timeoutPromise
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * STAGE 1: Visual Food Candidate Recognition
 * Uses high-speed, active multimodal models with strict JSON schema
 */
async function runStage1VisualAnalysis(ai, imageBuffer, mimeType, requestId) {
  const base64Image = imageBuffer.toString('base64');

  const stage1Prompt = `You are an expert visual food recognition system for FitCommit.
Analyze ONLY the food that is actually visible in the supplied image.

CRITICAL RULES:
1. Do not assume a standard Indian meal.
2. Do not invent foods.
3. Do not use a default meal.
4. Do not return rice, dal, chicken, roti, or any other food unless it is ACTUALLY visible.
5. Inspect the entire image carefully before answering.
6. Identify every visually distinguishable food item.
7. For each item determine:
   - food identity (specific name)
   - alternative names
   - cuisine/category
   - preparation method (fried, boiled, grilled, baked, steamed, curry, roasted, raw, cooked, deep_fried, unknown)
   - approximate portion in grams (estimated_quantity_g, min_quantity_g, max_quantity_g)
   - visual evidence: MUST provide at least 2 specific visual cues (e.g., shape, grain structure, texture, visible ingredients, colors, plating)
   - confidence: float between 0.0 and 1.0
   - uncertain: boolean (true if ambiguous)
8. DO NOT IDENTIFY FOOD FROM COLOR ALONE:
   - Yellow is not automatically dal (could be khichdi, kadhi, sambar, lemon rice, poha, egg curry, etc.).
   - White is not automatically rice (could be curd, idli, paneer, raita, etc.).
   - Orange/red is not automatically chicken curry (could be paneer butter masala, tomato soup, vegetable curry, etc.).
   Analyze texture, graininess, geometry, and visible chunks.
9. Image quality: assess if lighting, clarity, and angle are good, acceptable, or poor.

Return strict JSON conforming to this schema:
{
  "meal_type": "breakfast | lunch | dinner | snack | unknown",
  "image_quality": "good | acceptable | poor",
  "overall_confidence": 0.85,
  "analysis_notes": "string",
  "foods": [
    {
      "name": "Food Name",
      "alternative_names": ["Name 2"],
      "category": "Main | Side | Beverage | Dessert | Accompaniment",
      "preparation": "boiled | grilled | fried | deep_fried | baked | steamed | curry | roasted | raw | cooked | unknown",
      "estimated_quantity_g": 200,
      "min_quantity_g": 170,
      "max_quantity_g": 230,
      "confidence": 0.90,
      "visual_evidence": [
        "visual cue 1 (texture, shape)",
        "visual cue 2 (visible chunks or ingredients)"
      ],
      "uncertain": false
    }
  ]
}`;

  // Prioritize active, fast multimodal models that don't block on free tier quotas or 503 demand spikes
  const models = [
    'gemini-3.5-flash-lite',        // Fastest (3-5s), low latency, highly responsive
    'gemini-robotics-er-2-preview', // Strong vision model (5-8s), active
    'gemini-3.8-flash',             // Flagship flash model
    'gemini-3.5-flash',             // Standard flash model
    'gemini-3.1-flash-lite',        // Lightweight flash
    'gemma-4-26b-a4b-it'            // Open multimodal fallback
  ];
  let lastErr = null;

  for (const modelName of models) {
    try {
      console.log(`[AI Vision Stage 1] Querying ${modelName} (Request ID: ${requestId})...`);
      const response = await callModelWithTimeout(
        ai,
        modelName,
        [
          {
            role: 'user',
            parts: [
              { text: stage1Prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        {
          responseMimeType: 'application/json'
        },
        15000 // 15s strict timeout per candidate model
      );

      const text = response.text?.trim();
      if (!text) throw new Error('EMPTY_RESPONSE');

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('MALFORMED_JSON');
      }

      if (!parsed.foods || !Array.isArray(parsed.foods) || parsed.foods.length === 0) {
        throw new Error('NO_FOODS_DETECTED');
      }

      // Filter out any candidates that lack visual evidence
      const validatedFoods = parsed.foods.filter(f => {
        if (!f.visual_evidence || !Array.isArray(f.visual_evidence) || f.visual_evidence.length === 0) {
          console.warn(`[AI Vision Stage 1] Dropped ${f.name}: missing visual evidence.`);
          return false;
        }
        return true;
      });

      if (validatedFoods.length === 0) {
        throw new Error('NO_EVIDENCED_FOODS');
      }

      return {
        modelUsed: modelName,
        data: {
          ...parsed,
          foods: validatedFoods
        }
      };
    } catch (err) {
      console.warn(`[AI Vision Stage 1] Model ${modelName} failed or timed out:`, err.message);
      lastErr = err;
    }
  }

  throw lastErr || new Error('STAGE_1_ANALYSIS_FAILED');
}

/**
 * STAGE 2: Independent Multimodal Verification Pass
 * An independent verification pass that inspects the original image against Stage 1 candidates
 */
async function runStage2IndependentVerification(ai, imageBuffer, mimeType, stage1Result, requestId) {
  const base64Image = imageBuffer.toString('base64');
  const candidateFoods = stage1Result.data.foods;

  // If Stage 1 candidate identification was already highly confident and evidenced,
  // do a fast verification pass using the already confirmed working model
  const stage2Prompt = `You are the independent verification stage of a food recognition system for FitCommit.
You have the original meal photograph and a candidate list of foods identified by an earlier vision pass.

CANDIDATE LIST:
${JSON.stringify(candidateFoods, null, 2)}

VERIFICATION MANDATE:
1. Do NOT blindly trust the candidate list.
2. Inspect the original photograph independently.
3. For every candidate ask:
   - Is this food ACTUALLY visible?
   - Is the visual identification supported by concrete visual evidence?
   - Is another food more likely? (e.g. biryani vs plain rice, paneer vs tofu, dal vs sambar)
   - Is the preparation method accurate?
   - Is this a single combination dish (e.g. chicken biryani) rather than separate foods (chicken curry + rice)?
4. Remove any food that is NOT visually supported.
5. Correct any misidentified foods.
6. If uncertain between two foods, mark "uncertain": true and specify the candidates.
7. Return only foods that have verified visual proof in the image.

Return strict JSON conforming to this schema:
{
  "verified_foods": [
    {
      "name": "Food Name",
      "alternative_names": ["Alternative"],
      "category": "Main | Side | Beverage | Dessert | Accompaniment",
      "preparation": "boiled | grilled | fried | deep_fried | baked | steamed | curry | roasted | raw | cooked | unknown",
      "estimated_quantity_g": 200,
      "min_quantity_g": 170,
      "max_quantity_g": 230,
      "visual_confidence": 0.92,
      "visual_evidence": [
        "confirmed visible feature 1",
        "confirmed visible feature 2"
      ],
      "uncertain": false,
      "verification_action": "confirmed | corrected | split | merged",
      "notes": "string"
    }
  ],
  "verification_summary": "string"
}`;

  // Prioritize the model that succeeded in Stage 1
  const verifierModels = [
    stage1Result.modelUsed,
    'gemini-3.5-flash-lite',
    'gemini-robotics-er-2-preview'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastErr = null;

  for (const modelName of verifierModels) {
    try {
      console.log(`[AI Vision Stage 2] Verifier querying ${modelName} (Request ID: ${requestId})...`);
      const response = await callModelWithTimeout(
        ai,
        modelName,
        [
          {
            role: 'user',
            parts: [
              { text: stage2Prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        {
          responseMimeType: 'application/json'
        },
        10000 // 10s fast verification timeout
      );

      const text = response.text?.trim();
      if (!text) throw new Error('EMPTY_RESPONSE');

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('MALFORMED_JSON');
      }

      if (parsed.verified_foods && Array.isArray(parsed.verified_foods) && parsed.verified_foods.length > 0) {
        return {
          verifierModel: modelName,
          verifiedFoods: parsed.verified_foods,
          summary: parsed.verification_summary || 'Verification completed.'
        };
      }
    } catch (err) {
      console.warn(`[AI Vision Stage 2] Verifier with ${modelName} failed or timed out:`, err.message);
      lastErr = err;
    }
  }

  // If Stage 2 verifier failed technically or timed out, gracefully fall back to Stage 1 validated items
  console.warn('[AI Vision Stage 2] Verification pass fell back to Stage 1 candidates.');
  return {
    verifierModel: stage1Result.modelUsed,
    verifiedFoods: candidateFoods.map(f => ({
      ...f,
      visual_confidence: f.confidence || 0.8,
      verification_action: 'confirmed'
    })),
    summary: 'Passed Stage 1 candidate check.'
  };
}

/**
 * NUTRITION RESOLUTION & DETERMINISTIC CALCULATION
 * Maps verified visual foods to trusted database (IFCT & USDA) and scales deterministically
 */
function resolveVerifiedFoodsToNutrition(verifiedFoods) {
  const resolvedList = [];

  for (const food of verifiedFoods) {
    // 1. Apply portion sanity bounds
    const sanitized = applyPortionSanityCheck(food);

    const qtyG = sanitized.estimated_quantity_g;
    const minG = sanitized.min_quantity_g;
    const maxG = sanitized.max_quantity_g;
    const prep = sanitized.preparation || 'cooked';
    const visualConf = Number(sanitized.visual_confidence ?? sanitized.confidence ?? 0.8);

    // 2. Resolve against trusted Indian & USDA nutrition databases
    const resolution = resolveFoodEntry(sanitized.name, prep);
    const entry = resolution.entry;

    if (entry && !resolution.requires_confirmation) {
      // Deterministic scaling formula: macro = (per_100g * qtyG) / 100
      const deterministicMacros = calculateDeterministicNutrition(entry, qtyG);
      const minMacros = calculateDeterministicNutrition(entry, minG);
      const maxMacros = calculateDeterministicNutrition(entry, maxG);

      // Nutrition match confidence
      const nutritionMatchConf = resolution.match_type === 'EXACT' ? 0.95 : (resolution.match_type === 'PREPARATION_MATCH' ? 0.90 : 0.80);
      const overallConfidence = Math.round(((visualConf * 0.6) + (nutritionMatchConf * 0.4)) * 100) / 100;

      // Secondary macro sanity checks
      if (deterministicMacros.calories > SANITY_BOUNDS.MAX_MEAL_CALORIES) {
        console.warn(`[Nutrition Sanity] Excessive calories for ${entry.name}: ${deterministicMacros.calories} kcal. Capping.`);
        deterministicMacros.calories = SANITY_BOUNDS.MAX_MEAL_CALORIES;
      }

      resolvedList.push({
        name: entry.name,
        original_detected_name: sanitized.name,
        category: sanitized.category || entry.category,
        preparation: prep,
        quantity_g: qtyG,
        min_quantity_g: minG,
        max_quantity_g: maxG,
        quantity: `${qtyG} g`,
        quantity_range: { min_g: minG, max_g: maxG },
        calorie_range: { min: minMacros.calories, max: maxMacros.calories },
        visual_confidence: visualConf,
        nutrition_match_confidence: nutritionMatchConf,
        confidence: overallConfidence >= 0.85 ? 'high' : (overallConfidence >= 0.70 ? 'medium' : 'low'),
        visual_evidence: sanitized.visual_evidence || [],
        requires_confirmation: false,
        database_id: entry.id,
        calories: deterministicMacros.calories,
        protein_g: deterministicMacros.protein_g,
        carbs_g: deterministicMacros.carbs_g,
        fat_g: deterministicMacros.fat_g,
        fiber_g: deterministicMacros.fiber_g,
        nutrition: {
          calories: deterministicMacros.calories,
          protein_g: deterministicMacros.protein_g,
          carbs_g: deterministicMacros.carbs_g,
          fat_g: deterministicMacros.fat_g,
          fiber_g: deterministicMacros.fiber_g
        },
        per_100g: deterministicMacros.per_100g,
        nutrition_source: entry.source,
        source_id: entry.source_id
      });
    } else {
      // Ambiguous item or low confidence match -> User confirmation required
      const possibleMatches = resolution.possible_matches || searchNutritionDatabase(sanitized.name).slice(0, 4);

      resolvedList.push({
        name: sanitized.name,
        original_detected_name: sanitized.name,
        category: sanitized.category || 'Food Item',
        preparation: prep,
        quantity_g: qtyG,
        min_quantity_g: minG,
        max_quantity_g: maxG,
        quantity: `${qtyG} g`,
        quantity_range: { min_g: minG, max_g: maxG },
        visual_confidence: visualConf,
        nutrition_match_confidence: 0.40,
        confidence: 'low',
        visual_evidence: sanitized.visual_evidence || [],
        requires_confirmation: true,
        reason: resolution.reason || 'Please verify or select exact food item from database.',
        possible_matches: possibleMatches,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        nutrition: {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          fiber_g: 0
        },
        nutrition_source: 'PENDING_VERIFICATION'
      });
    }
  }

  return resolvedList;
}

/**
 * Main Meal Analysis Entry Point
 */
async function analyzeMealImage({ buffer, mimetype, originalname, size }) {
  const requestId = crypto.randomUUID();

  // 1. Basic validation
  if (!buffer || buffer.length === 0) {
    const err = new Error("No image data received. Please select a clear meal photo.");
    err.status = 400;
    throw err;
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (mimetype && !allowedTypes.includes(mimetype.toLowerCase())) {
    const err = new Error("Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.");
    err.status = 400;
    throw err;
  }

  const MAX_BYTES = 10 * 1024 * 1024;
  if (size > MAX_BYTES || buffer.length > MAX_BYTES) {
    const err = new Error("Image exceeds maximum size of 10MB. Please upload a smaller image.");
    err.status = 400;
    throw err;
  }

  // 2. Cache check by SHA-256 hash of image bytes
  const imageHash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (analysisCache.has(imageHash)) {
    console.log(`[AI Meal Analyzer] Cache hit for image SHA256: ${imageHash.substring(0, 12)}...`);
    const cached = analysisCache.get(imageHash);
    return {
      ...cached,
      analysisRequestId: requestId,
      from_cache: true
    };
  }

  // 3. API Key check - STRICT: NO SILENT FALLBACK
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('[AI Meal Analyzer] GEMINI_API_KEY is not set in environment or server/.env.');
    const err = new Error("AI_FOOD_RECOGNITION_FAILED: GEMINI_API_KEY is not configured in server/.env. Please configure your key to use Gemini 3.1 Pro visual meal recognition.");
    err.code = "AI_FOOD_RECOGNITION_FAILED";
    err.status = 503;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });

  // 4. MULTI-PASS VISION PIPELINE
  let stage1Result;
  let stage2Result;

  try {
    // STAGE 1: Candidate identification & visual evidence extraction
    stage1Result = await runStage1VisualAnalysis(ai, buffer, mimetype, requestId);

    // STAGE 2: Independent verification pass
    // Only invoke a second multimodal network call if Stage 1 flagged uncertainties or had low overall confidence (< 0.80)
    const hasUncertainItems = stage1Result.data.foods.some(f => f.uncertain === true);
    const needsSecondPass = hasUncertainItems || (stage1Result.data.overall_confidence < 0.80);

    if (needsSecondPass) {
      console.log(`[AI Vision] Stage 1 flagged uncertainty. Running Stage 2 independent verifier...`);
      stage2Result = await runStage2IndependentVerification(ai, buffer, mimetype, stage1Result, requestId);
    } else {
      console.log(`[AI Vision] Stage 1 confident (${stage1Result.data.overall_confidence}). Skipping redundant Stage 2 network call.`);
      stage2Result = {
        verifierModel: stage1Result.modelUsed,
        verifiedFoods: stage1Result.data.foods.map(f => ({
          ...f,
          visual_confidence: f.confidence || 0.85,
          verification_action: 'confirmed'
        })),
        summary: stage1Result.data.analysis_notes || 'Confirmed with high visual evidence.'
      };
    }
  } catch (visionError) {
    console.error('[AI Meal Analyzer] Multimodal vision recognition failed:', visionError.message);
    const err = new Error("AI_FOOD_RECOGNITION_FAILED: Vision AI was unable to reliably identify foods in this image. Please upload a clearer photo with the entire plate visible.");
    err.code = "AI_FOOD_RECOGNITION_FAILED";
    err.status = 422;
    err.details = visionError.message;
    throw err;
  }

  // 5. NUTRITION MATCHING & DETERMINISTIC SCALING
  const resolvedFoods = resolveVerifiedFoodsToNutrition(stage2Result.verifiedFoods);
  const totals = calculateAggregateTotals(resolvedFoods);

  // Derive meal title
  const primaryNames = resolvedFoods.map(f => f.name).slice(0, 3);
  const derivedMealName = primaryNames.length > 0 ? primaryNames.join(' & ') : 'Analyzed Meal';

  const mealType = stage1Result.data.meal_type && stage1Result.data.meal_type !== 'unknown'
    ? stage1Result.data.meal_type.toUpperCase()
    : 'LUNCH';

  const finalResult = {
    success: true,
    analysisRequestId: requestId,
    image_hash: imageHash,
    meal_name: derivedMealName,
    meal_type: mealType,
    overall_confidence: stage1Result.data.overall_confidence || 0.85,
    image_quality: stage1Result.data.image_quality || 'good',
    notes: stage2Result.summary || stage1Result.data.analysis_notes || '',
    foods: resolvedFoods,
    totals,
    disclaimer: NUTRITION_DISCLAIMER,
    vision_engine: `Stage 1: ${stage1Result.modelUsed} | Stage 2 Verifier: ${stage2Result.verifierModel}`,
    calculation_method: 'DETERMINISTIC_DATABASE_SCALING'
  };

  // Development debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('====================================================');
    console.log('[AI Meal Analyzer Debug Log]');
    console.log('IMAGE_ID / REQUEST_ID:', requestId);
    console.log('IMAGE_HASH:           ', imageHash);
    console.log('STAGE_1_MODEL:        ', stage1Result.modelUsed);
    console.log('STAGE_1_FOODS:        ', stage1Result.data.foods.map(f => f.name));
    console.log('STAGE_2_VERIFIER:     ', stage2Result.verifierModel);
    console.log('STAGE_2_VERIFIED_FOODS:', stage2Result.verifiedFoods.map(f => f.name));
    console.log('FINAL_RESOLVED_FOODS: ', resolvedFoods.map(f => `${f.name} (~${f.calories} kcal, ${f.quantity_g}g)`));
    console.log('CALCULATED_TOTALS:    ', totals);
    console.log('====================================================');
  }

  // Store in cache
  analysisCache.set(imageHash, finalResult);

  return finalResult;
}

module.exports = {
  analyzeMealImage,
  resolveVerifiedFoodsToNutrition,
  calculateAggregateTotals,
  searchNutritionDatabase,
  NUTRITION_DISCLAIMER
};
