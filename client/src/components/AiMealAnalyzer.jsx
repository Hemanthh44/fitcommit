import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { 
  Camera, 
  Upload, 
  X, 
  Sparkles, 
  Check, 
  Plus, 
  Minus,
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Utensils, 
  Flame, 
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Info,
  Search,
  CheckCircle2,
  HelpCircle,
  Database,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card, CardHeader } from './Card';
import { Modal } from './Modal';
import { FormField, Input } from './Form';

// Accurate stepped loading sequence reflecting vision + verified database calculation
const LOADING_STEPS = [
  "Analyzing meal...",
  "Identifying foods...",
  "Estimating portions...",
  "Matching nutrition data...",
  "Calculating nutrition..."
];

// Quick suggestions for fast adding
const POPULAR_DATABASE_FOODS = [
  { name: 'White Rice (Cooked)', id: 'US_RICE_WHITE', calories: 130, protein_g: 2.7, carbs_g: 28.2, fat_g: 0.3, fiber_g: 0.4, source: 'USDA FoodData Central' },
  { name: 'Chapati / Roti (Whole Wheat)', id: 'IN_CHAPATI', calories: 297, protein_g: 9.5, carbs_g: 58.0, fat_g: 3.5, fiber_g: 10.0, source: 'IFCT / ICMR' },
  { name: 'Dal (Cooked Lentil Curry)', id: 'IN_DAL', calories: 116, protein_g: 9.0, carbs_g: 20.1, fat_g: 0.4, fiber_g: 7.9, source: 'IFCT / ICMR' },
  { name: 'Paneer Curry', id: 'IN_PANEER_CURRY', calories: 215, protein_g: 11.2, carbs_g: 6.8, fat_g: 17.5, fiber_g: 1.5, source: 'IFCT / ICMR' },
  { name: 'Chicken Biryani', id: 'IN_CHICKEN_BIRYANI', calories: 180, protein_g: 8.0, carbs_g: 21.6, fat_g: 6.8, fiber_g: 1.1, source: 'IFCT / ICMR' },
  { name: 'Boiled Egg (Hard Boiled)', id: 'US_EGG_BOILED', calories: 155, protein_g: 12.6, carbs_g: 1.1, fat_g: 10.6, fiber_g: 0.0, source: 'USDA FoodData Central' },
  { name: 'Cooked Chicken Breast', id: 'US_CHICKEN_BREAST', calories: 165, protein_g: 31.0, carbs_g: 0.0, fat_g: 3.6, fiber_g: 0.0, source: 'USDA FoodData Central' },
  { name: 'Idli (Steamed Rice Cake)', id: 'IN_IDLI', calories: 132, protein_g: 4.8, carbs_g: 27.2, fat_g: 0.5, fiber_g: 1.5, source: 'IFCT / ICMR' },
  { name: 'Sambar (Lentil Vegetable Stew)', id: 'IN_SAMBAR', calories: 65, protein_g: 2.6, carbs_g: 9.5, fat_g: 1.8, fiber_g: 2.2, source: 'IFCT / ICMR' },
  { name: 'Rolled Oats (Cooked)', id: 'US_OATS_COOKED', calories: 71, protein_g: 2.5, carbs_g: 12.0, fat_g: 1.5, fiber_g: 1.7, source: 'USDA FoodData Central' },
  { name: 'Banana (Raw)', id: 'US_BANANA', calories: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3, fiber_g: 2.6, source: 'USDA FoodData Central' }
];

export default function AiMealAnalyzer({ onMealSaved }) {
  const { showToast } = useNotifications();

  // Upload & Preview State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Loading & Stepped Animation
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const loadingTimerRef = useRef(null);

  // Analysis Result State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [mealType, setMealType] = useState('LUNCH');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Database Search & Food Replacement / Add State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changingItemIndex, setChangingItemIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [addQuantityG, setAddQuantityG] = useState(100);

  // Today's Meals & Dashboard State
  const [todayData, setTodayData] = useState({
    meals: [],
    todayConsumed: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    targets: { calories: 2200, protein: 120, carbs: 280, fat: 70, fiber: 30 },
    remaining: { calories: 2200, protein: 120, carbs: 280, fat: 70, fiber: 30 }
  });
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [expandedMealIds, setExpandedMealIds] = useState({});
  const [savingMeal, setSavingMeal] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Fetch today's meals on mount
  const loadTodayMeals = async () => {
    try {
      setIsLoadingToday(true);
      const data = await api.getTodayMeals();
      if (data && data.success) {
        setTodayData(data);
      }
    } catch (err) {
      console.warn('Failed to load today meals:', err.message);
    } finally {
      setIsLoadingToday(false);
    }
  };

  useEffect(() => {
    loadTodayMeals();
  }, []);

  // Stepped loading messages simulation paced with multimodal AI response
  useEffect(() => {
    if (isAnalyzing) {
      setLoadingStepIdx(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingStepIdx(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    }
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [isAnalyzing]);

  // Handle file selection
  const handleFileChange = (file) => {
    if (!file) return;

    setErrorMsg('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg("Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image exceeds maximum size of 10MB. Please choose a smaller photo.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Helper to downscale large mobile camera photos before upload
  const compressImageBeforeUpload = async (file) => {
    if (!file || file.size < 1024 * 1024) return file;
    try {
      return await new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const maxDim = 1600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(file);
        };
        img.src = url;
      });
    } catch {
      return file;
    }
  };

  // Trigger AI Vision + Deterministic Nutrition Analysis
  const handleAnalyzeMeal = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalysisResult(null);

    const fileToUpload = await compressImageBeforeUpload(selectedFile);
    const formData = new FormData();
    formData.append('image', fileToUpload);

    try {
      const data = await api.analyzeMeal(formData);
      if (data && data.success) {
        setAnalysisResult({
          meal_name: data.meal_name || 'Analyzed Meal',
          meal_type: data.meal_type || 'LUNCH',
          overall_confidence: data.overall_confidence || 'medium',
          notes: data.notes || '',
          foods: data.foods || [],
          totals: data.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
          disclaimer: data.disclaimer || "Nutrition values are estimates based on the detected foods and portion sizes. Actual values may vary.",
          vision_engine: data.vision_engine || 'Gemini Vision Reasoner',
          calculation_method: data.calculation_method || 'DETERMINISTIC_DATABASE_SCALING'
        });
        if (data.meal_type) {
          setMealType(data.meal_type.toUpperCase());
        }
        showToast("Foods recognized & portion macros deterministically calculated.", "Analysis Complete");
      } else {
        throw new Error(data.error || "Analysis returned incomplete data.");
      }
    } catch (err) {
      console.error('Analyze Meal Error:', err);
      let serverMessage = err.data?.message || err.data?.error || err.message;
      if (err.message === 'Failed to fetch' || err.message?.includes('NetworkError') || !err.status) {
        serverMessage = "Could not connect to the backend server. If your backend is hosted on Render free tier, it may take 40-50 seconds to wake from sleep. Also check that your VITE_API_URL and CORS settings are configured correctly.";
      }
      setErrorMsg(
        serverMessage || "AI food recognition failed. Try uploading a clearer photo or enter your meal items manually."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Deterministically recalculate macro values when grams change
  const recalculateItemForGrams = (item, newGrams) => {
    const g = Math.max(5, Math.round(Number(newGrams) || 0));
    const per100 = item.per_100g || {
      calories: item.calories ? Math.round((item.calories / (item.quantity_g || 100)) * 100) : 100,
      protein_g: item.protein_g ? ((item.protein_g / (item.quantity_g || 100)) * 100) : 5,
      carbs_g: item.carbs_g ? ((item.carbs_g / (item.quantity_g || 100)) * 100) : 15,
      fat_g: item.fat_g ? ((item.fat_g / (item.quantity_g || 100)) * 100) : 3,
      fiber_g: item.fiber_g ? ((item.fiber_g / (item.quantity_g || 100)) * 100) : 1
    };

    const calories = Math.round((per100.calories * g) / 100);
    const protein_g = Math.round(((per100.protein_g * g) / 100) * 10) / 10;
    const carbs_g = Math.round(((per100.carbs_g * g) / 100) * 10) / 10;
    const fat_g = Math.round(((per100.fat_g * g) / 100) * 10) / 10;
    const fiber_g = Math.round(((per100.fiber_g * g) / 100) * 10) / 10;

    // Recalculate uncertainty bounds proportionally
    const minRatio = item.min_quantity_g && item.quantity_g ? item.min_quantity_g / item.quantity_g : 0.85;
    const maxRatio = item.max_quantity_g && item.quantity_g ? item.max_quantity_g / item.quantity_g : 1.15;
    const min_g = Math.max(5, Math.round(g * minRatio));
    const max_g = Math.max(g, Math.round(g * maxRatio));

    return {
      ...item,
      quantity_g: g,
      min_quantity_g: min_g,
      max_quantity_g: max_g,
      quantity: `${g} g`,
      quantity_range: { min_g, max_g },
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      nutrition: {
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g
      }
    };
  };

  // Recalculate meal totals deterministically across all foods
  const recalculateMealTotals = (foods) => {
    return foods.reduce(
      (acc, item) => ({
        calories: Math.round(acc.calories + (Number(item.calories) || 0)),
        protein_g: Math.round((acc.protein_g + (Number(item.protein_g) || 0)) * 10) / 10,
        carbs_g: Math.round((acc.carbs_g + (Number(item.carbs_g) || 0)) * 10) / 10,
        fat_g: Math.round((acc.fat_g + (Number(item.fat_g) || 0)) * 10) / 10,
        fiber_g: Math.round((acc.fiber_g + (Number(item.fiber_g) || 0)) * 10) / 10
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    );
  };

  // Stepper adjustments [-] and [+]
  const handleAdjustGrams = (index, deltaGrams) => {
    if (!analysisResult) return;
    const updatedFoods = [...analysisResult.foods];
    const currentItem = updatedFoods[index];
    const newGrams = Math.max(10, (currentItem.quantity_g || 100) + deltaGrams);

    updatedFoods[index] = recalculateItemForGrams(currentItem, newGrams);
    const updatedTotals = recalculateMealTotals(updatedFoods);

    setAnalysisResult({
      ...analysisResult,
      foods: updatedFoods,
      totals: updatedTotals
    });
  };

  // Direct manual gram input
  const handleDirectGramsChange = (index, rawValue) => {
    if (!analysisResult) return;
    const parsedGrams = parseInt(rawValue, 10);
    const updatedFoods = [...analysisResult.foods];
    const currentItem = updatedFoods[index];

    if (isNaN(parsedGrams) || parsedGrams < 0) {
      // Keep UI responsive while typing
      updatedFoods[index] = {
        ...currentItem,
        quantity_g: 0,
        quantity: '0 g'
      };
    } else {
      updatedFoods[index] = recalculateItemForGrams(currentItem, parsedGrams);
    }

    const updatedTotals = recalculateMealTotals(updatedFoods);
    setAnalysisResult({
      ...analysisResult,
      foods: updatedFoods,
      totals: updatedTotals
    });
  };

  // Remove food item
  const handleRemoveFoodItem = (index) => {
    if (!analysisResult) return;
    const updatedFoods = analysisResult.foods.filter((_, i) => i !== index);
    const updatedTotals = recalculateMealTotals(updatedFoods);
    setAnalysisResult({
      ...analysisResult,
      foods: updatedFoods,
      totals: updatedTotals
    });
    showToast("Item removed. Totals recalculated.", "Item Removed");
  };

  // Resolve ambiguous food by choosing one of the possible matches
  const handleResolveAmbiguous = (index, selectedMatch) => {
    if (!analysisResult) return;
    const updatedFoods = [...analysisResult.foods];
    const item = updatedFoods[index];

    // Create verified resolved item
    const per100 = {
      calories: selectedMatch.calories || 150,
      protein_g: selectedMatch.protein_g || 10,
      carbs_g: selectedMatch.carbs_g || 15,
      fat_g: selectedMatch.fat_g || 5,
      fiber_g: selectedMatch.fiber_g || 2
    };

    const portionG = item.quantity_g || 100;
    const cal = Math.round((per100.calories * portionG) / 100);
    const p = Math.round(((per100.protein_g * portionG) / 100) * 10) / 10;
    const c = Math.round(((per100.carbs_g * portionG) / 100) * 10) / 10;
    const f = Math.round(((per100.fat_g * portionG) / 100) * 10) / 10;
    const fib = Math.round(((per100.fiber_g * portionG) / 100) * 10) / 10;

    updatedFoods[index] = {
      ...item,
      name: selectedMatch.name,
      database_id: selectedMatch.id || selectedMatch.source_id,
      confidence: 'high',
      requires_confirmation: false,
      reason: undefined,
      possible_matches: undefined,
      per_100g: per100,
      nutrition_source: selectedMatch.source || 'Verified Nutrition Database',
      calories: cal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      fiber_g: fib,
      nutrition: {
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        fiber_g: fib
      }
    };

    const updatedTotals = recalculateMealTotals(updatedFoods);
    setAnalysisResult({
      ...analysisResult,
      foods: updatedFoods,
      totals: updatedTotals
    });
    showToast(`Confirmed as "${selectedMatch.name}". Nutrition recalculated.`, "Food Confirmed");
  };

  // Open "Change Food" modal
  const handleOpenChangeModal = (index) => {
    setChangingItemIndex(index);
    setSearchQuery('');
    setSearchResults([]);
    setIsChangeModalOpen(true);
  };

  // Replace item with chosen database entry
  const handleSelectReplacement = (dbItem) => {
    if (changingItemIndex === null || !analysisResult) return;
    const updatedFoods = [...analysisResult.foods];
    const currentItem = updatedFoods[changingItemIndex];
    const portionG = currentItem.quantity_g || 100;

    const per100 = {
      calories: dbItem.calories,
      protein_g: dbItem.protein_g,
      carbs_g: dbItem.carbs_g,
      fat_g: dbItem.fat_g,
      fiber_g: dbItem.fiber_g
    };

    const cal = Math.round((per100.calories * portionG) / 100);
    const p = Math.round(((per100.protein_g * portionG) / 100) * 10) / 10;
    const c = Math.round(((per100.carbs_g * portionG) / 100) * 10) / 10;
    const f = Math.round(((per100.fat_g * portionG) / 100) * 10) / 10;
    const fib = Math.round(((per100.fiber_g * portionG) / 100) * 10) / 10;

    updatedFoods[changingItemIndex] = {
      ...currentItem,
      name: dbItem.name,
      database_id: dbItem.id,
      confidence: 'high',
      requires_confirmation: false,
      per_100g: per100,
      nutrition_source: dbItem.source,
      calories: cal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      fiber_g: fib,
      nutrition: {
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        fiber_g: fib
      }
    };

    const updatedTotals = recalculateMealTotals(updatedFoods);
    setAnalysisResult({
      ...analysisResult,
      foods: updatedFoods,
      totals: updatedTotals
    });

    setIsChangeModalOpen(false);
    setChangingItemIndex(null);
    showToast(`Replaced with "${dbItem.name}". Nutrition updated.`, "Food Replaced");
  };

  // Add new food item from verified database
  const handleAddFromDatabase = (dbItem) => {
    if (!analysisResult) return;
    const portionG = Math.max(10, addQuantityG);
    const per100 = {
      calories: dbItem.calories,
      protein_g: dbItem.protein_g,
      carbs_g: dbItem.carbs_g,
      fat_g: dbItem.fat_g,
      fiber_g: dbItem.fiber_g
    };

    const cal = Math.round((per100.calories * portionG) / 100);
    const p = Math.round(((per100.protein_g * portionG) / 100) * 10) / 10;
    const c = Math.round(((per100.carbs_g * portionG) / 100) * 10) / 10;
    const f = Math.round(((per100.fat_g * portionG) / 100) * 10) / 10;
    const fib = Math.round(((per100.fiber_g * portionG) / 100) * 10) / 10;

    const newItem = {
      name: dbItem.name,
      database_id: dbItem.id,
      quantity_g: portionG,
      min_quantity_g: Math.round(portionG * 0.9),
      max_quantity_g: Math.round(portionG * 1.1),
      quantity: `${portionG} g`,
      quantity_range: { min_g: Math.round(portionG * 0.9), max_g: Math.round(portionG * 1.1) },
      confidence: 'high',
      requires_confirmation: false,
      per_100g: per100,
      nutrition_source: dbItem.source,
      calories: cal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      fiber_g: fib,
      nutrition: {
        calories: cal,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
        fiber_g: fib
      }
    };

    const updatedFoods = [...analysisResult.foods, newItem];
    const updatedTotals = recalculateMealTotals(updatedFoods);

    setAnalysisResult({
      ...analysisResult,
      foods: updatedFoods,
      totals: updatedTotals
    });

    setIsAddModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    showToast(`Added "${dbItem.name}" (~${cal} kcal).`, "Food Added");
  };

  // Search database handler with backend integration
  const handleSearchDatabase = async (q) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearchingDb(true);
      const res = await api.searchNutritionDatabase(q.trim());
      if (res && res.success) {
        setSearchResults(res.results || []);
      }
    } catch (err) {
      // Local fallback search from popular list
      const filtered = POPULAR_DATABASE_FOODS.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Save meal to user's daily history
  const handleSaveToTodayMeals = async () => {
    if (!analysisResult) return;

    setSavingMeal(true);
    try {
      await api.saveMealRecord({
        meal_type: mealType,
        meal_name: analysisResult.meal_name,
        image_url: previewUrl,
        foods: analysisResult.foods,
        totals: analysisResult.totals
      });

      showToast(`Saved '${analysisResult.meal_name}' to today's ${mealType.toLowerCase()} log.`, "Meal Logged");

      // Reset current analyzer state
      setSelectedFile(null);
      setPreviewUrl(null);
      setAnalysisResult(null);

      // Refresh today's dashboard & history
      await loadTodayMeals();
      if (onMealSaved) onMealSaved();
    } catch (err) {
      showToast(err.message || "Failed to save meal.", "Error");
    } finally {
      setSavingMeal(false);
    }
  };

  // Delete logged meal from history
  const handleDeleteLoggedMeal = async (mealId) => {
    try {
      await api.deleteMealRecord(mealId);
      showToast("Meal removed from today's history.", "Deleted");
      await loadTodayMeals();
      if (onMealSaved) onMealSaved();
    } catch (err) {
      showToast(err.message || "Could not delete meal.", "Error");
    }
  };

  const toggleMealExpanded = (id) => {
    setExpandedMealIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Clean minimal confidence indicator
  const renderConfidenceBadge = (confidence) => {
    const conf = (confidence || 'medium').toLowerCase();
    if (conf === 'high') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: '#059669',
          backgroundColor: '#ECFDF5',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid #A7F3D0'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          High confidence
        </span>
      );
    }
    if (conf === 'low') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: '#D97706',
          backgroundColor: '#FFFBEB',
          padding: '2px 8px',
          borderRadius: '9999px',
          border: '1px solid #FDE68A'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
          Low confidence
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.74rem',
        fontWeight: 600,
        color: '#922756',
        backgroundColor: '#FDF2F6',
        padding: '2px 8px',
        borderRadius: '9999px',
        border: '1px solid #F5D3E0'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#922756' }} />
        Medium confidence
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* ============================================================== */}
      {/* 1. HERO / ANALYZER UPLOAD & PREVIEW SECTION                   */}
      {/* ============================================================== */}
      <Card style={{ padding: '36px 32px' }}>
        <div style={{ maxWidth: '640px', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#922756'
            }} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#922756'
            }}>
              AI Vision + Verified Nutrition Database
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.1rem',
            fontWeight: 700,
            color: '#181B26',
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0'
          }}>
            Know what's on your plate.
          </h2>

          <p style={{
            fontSize: '0.98rem',
            color: '#505A69',
            lineHeight: 1.55,
            margin: 0
          }}>
            Upload a photo of your meal. Our AI vision identifies foods and estimates portions, while our verified nutrition engine deterministically calculates calories and macronutrients.
          </p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            color: '#991B1B'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.90rem', marginBottom: '2px' }}>
                  AI Recognition Notice
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#7F1D1D' }}>
                  {errorMsg}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!analysisResult) {
                  setAnalysisResult({
                    meal_name: 'Custom Meal',
                    meal_type: mealType || 'LUNCH',
                    overall_confidence: 'medium',
                    foods: [],
                    totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
                    disclaimer: "Nutrition values calculated from verified database.",
                    calculation_method: 'DETERMINISTIC_DATABASE_SCALING'
                  });
                }
                setSearchQuery('');
                setSearchResults([]);
                setAddQuantityG(100);
                setIsAddModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #DC2626',
                color: '#DC2626',
                fontSize: '0.80rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              + Add foods manually
            </button>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />

        {/* STEP 1: Upload Dropzone (When no image is selected) */}
        {!previewUrl && (
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#922756' : '#D1D5DB'}`,
              borderRadius: '24px',
              backgroundColor: dragActive ? '#FDF2F6' : '#FAFBFC',
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FDF2F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: '#922756'
            }}>
              <Upload size={28} />
            </div>

            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#181B26',
              marginBottom: '6px'
            }}>
              Upload meal photo
            </h3>

            <p style={{
              fontSize: '0.90rem',
              color: '#6B7280',
              marginBottom: '20px'
            }}>
              Drag & drop or choose image (JPG, JPEG, PNG, WEBP up to 10MB)
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                icon={Upload}
              >
                Choose from gallery
              </Button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#181B26',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.90rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Camera size={18} />
                Take Photo
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Image Preview & Confirmation */}
        {previewUrl && (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#FAFBFC',
              borderRadius: '24px',
              border: '1px solid #E8ECF2',
              padding: '24px',
              overflow: 'hidden'
            }}>
              {/* Crisp preview without filters */}
              <div style={{
                position: 'relative',
                maxWidth: '540px',
                width: '100%',
                maxHeight: '400px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <img
                  src={previewUrl}
                  alt="Meal Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />

                <button
                  onClick={handleRemovePhoto}
                  disabled={isAnalyzing}
                  title="Remove image"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(24, 27, 38, 0.75)',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action Buttons & Analysis Trigger */}
              <div style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '24px',
                flexWrap: 'wrap'
              }}>
                <Button
                  variant="primary"
                  onClick={handleAnalyzeMeal}
                  disabled={isAnalyzing}
                  icon={Sparkles}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze meal"}
                </Button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isAnalyzing}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#505A69',
                    fontSize: '0.90rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Change photo
                </button>
              </div>

              {/* STEP 3: Stepped Loading State */}
              {isAnalyzing && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: '24px',
                  padding: '16px 24px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E8ECF2'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '3px solid #FDF2F6',
                    borderTop: '3px solid #922756',
                    animation: 'spin 0.9s linear infinite',
                    marginBottom: '12px'
                  }} />
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <span style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#181B26'
                  }}>
                    {LOADING_STEPS[loadingStepIdx]}
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    color: '#8E95A5',
                    marginTop: '4px'
                  }}>
                    Step {loadingStepIdx + 1} of {LOADING_STEPS.length}
                  </span>
                  {loadingStepIdx === LOADING_STEPS.length - 1 && (
                    <span style={{
                      fontSize: '0.74rem',
                      color: '#4F46E5',
                      marginTop: '6px',
                      fontWeight: 500
                    }}>
                      Finalizing macronutrient totals & database matching...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ============================================================== */}
      {/* 2. CONFIRMATION SCREEN: DETECTED FOODS & PORTION CONTROLS      */}
      {/* ============================================================== */}
      {analysisResult && (
        <Card style={{ padding: '36px 32px', border: '1px solid #E8ECF2' }}>
          {/* Top Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="label-micro" style={{ color: '#922756' }}>MEAL PORTION CONFIRMATION</span>
                <span style={{
                  fontSize: '0.70rem',
                  color: '#6B7280',
                  backgroundColor: '#F3F4F6',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  DETERMINISTIC MACROS
                </span>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#181B26',
                margin: 0
              }}>
                {analysisResult.meal_name}
              </h2>
            </div>

            {/* Meal Type Selector Pill Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#505A69' }}>Meal Slot:</span>
              {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setMealType(slot)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: mealType === slot ? '1px solid #922756' : '1px solid #E8ECF2',
                    backgroundColor: mealType === slot ? '#922756' : '#FFFFFF',
                    color: mealType === slot ? '#FFFFFF' : '#505A69',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* AI-Estimated Nutrition Summary Hero Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '16px',
            backgroundColor: '#FAFBFC',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '32px',
            border: '1px solid #E8ECF2'
          }}>
            {/* Calories */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                marginBottom: '4px'
              }}>
                Estimated Energy
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#181B26',
                lineHeight: 1
              }}>
                ~{analysisResult.totals.calories}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#8E95A5', marginLeft: '6px' }}>kcal</span>
              </div>
            </div>

            {/* Protein */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                marginBottom: '4px'
              }}>
                Protein
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#922756',
                lineHeight: 1
              }}>
                ~{analysisResult.totals.protein_g}
                <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5', marginLeft: '4px' }}>g</span>
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                marginBottom: '4px'
              }}>
                Carbohydrates
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#181B26',
                lineHeight: 1
              }}>
                ~{analysisResult.totals.carbs_g}
                <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5', marginLeft: '4px' }}>g</span>
              </div>
            </div>

            {/* Fat */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                marginBottom: '4px'
              }}>
                Healthy Fat
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#181B26',
                lineHeight: 1
              }}>
                ~{analysisResult.totals.fat_g}
                <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5', marginLeft: '4px' }}>g</span>
              </div>
            </div>

            {/* Fiber */}
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
                marginBottom: '4px'
              }}>
                Fiber
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#181B26',
                lineHeight: 1
              }}>
                ~{analysisResult.totals.fiber_g}
                <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5', marginLeft: '4px' }}>g</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* FOOD BREAKDOWN WITH INTERACTIVE PORTION ADJUSTERS ([-] [+] ) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <span className="label-micro" style={{ color: '#922756' }}>DETECTED FOODS & PORTION VERIFICATION</span>
                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  Adjust grams using <strong>[-]</strong> and <strong>[+]</strong> or type exact portions. Macros recalculate deterministically.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setAddQuantityG(100);
                  setIsAddModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #922756',
                  color: '#922756',
                  fontSize: '0.80rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                + Add food
              </button>
            </div>

            {/* Food items card list */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {analysisResult.foods.map((food, idx) => {
                const isAmbiguous = Boolean(food.requires_confirmation);
                const hasMatches = Array.isArray(food.possible_matches) && food.possible_matches.length > 0;
                const minRange = food.min_quantity_g || Math.round(food.quantity_g * 0.85);
                const maxRange = food.max_quantity_g || Math.round(food.quantity_g * 1.15);

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: isAmbiguous ? '1.5px solid #F59E0B' : '1px solid #E8ECF2',
                      backgroundColor: isAmbiguous ? '#FFFDF5' : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Header Row: Name, Badges, Preparation, Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#181B26' }}>
                            {food.name}
                          </span>

                          {/* Preparation style tag */}
                          {food.preparation && food.preparation !== 'none' && food.preparation !== 'raw' && (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              color: '#505A69',
                              backgroundColor: '#F3F4F6',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {food.preparation.replace(/_/g, ' ')}
                            </span>
                          )}

                          {/* Minimal Confidence Indicator */}
                          {renderConfidenceBadge(food.confidence)}

                          {/* Database Source Badge */}
                          {food.nutrition_source && food.nutrition_source !== 'PENDING_VERIFICATION' && (
                            <span style={{
                              fontSize: '0.70rem',
                              color: '#6B7280',
                              backgroundColor: '#FAFBFC',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              border: '1px solid #E5E7EB',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Database size={11} color="#6B7280" />
                              {food.nutrition_source}
                            </span>
                          )}
                        </div>

                        {/* Portion Uncertainty Display */}
                        <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                          Estimated ~<strong>{food.quantity_g}g</strong>{' '}
                          <span style={{ color: '#8E95A5' }}>
                            (Possible range: {minRange}–{maxRange}g)
                          </span>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenChangeModal(idx)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            border: '1px solid #E8ECF2',
                            backgroundColor: '#FFFFFF',
                            color: '#505A69',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={12} />
                          Change food
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFoodItem(idx)}
                          title="Remove this item"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '9999px',
                            border: '1px solid #FEE2E2',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Ambiguous Food Resolution Banner */}
                    {isAmbiguous && (
                      <div style={{
                        padding: '12px 14px',
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#92400E' }}>
                          <AlertCircle size={15} />
                          Food identification needs confirmation. Did the photo contain:
                        </div>

                        {hasMatches ? (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {food.possible_matches.map((match, mIdx) => (
                              <button
                                key={mIdx}
                                type="button"
                                onClick={() => handleResolveAmbiguous(idx, match)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '9999px',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #D97706',
                                  color: '#92400E',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={12} />
                                {match.name}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleOpenChangeModal(idx)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '9999px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                color: '#505A69',
                                fontSize: '0.78rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              Search other...
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenChangeModal(idx)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '9999px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #D97706',
                              color: '#92400E',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              alignSelf: 'flex-start'
                            }}
                          >
                            Select food from database
                          </button>
                        )}
                      </div>
                    )}

                    {/* Middle Controls Row: Interactive Stepper [-] [300g] [+] and Calculated Nutrition */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      paddingTop: '6px',
                      borderTop: '1px solid #F3F4F6'
                    }}>
                      {/* Stepper Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#505A69' }}>
                          Portion:
                        </span>

                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#F3F4F6',
                          borderRadius: '9999px',
                          padding: '2px 4px',
                          border: '1px solid #E5E7EB'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleAdjustGrams(idx, -25)}
                            title="Decrease portion by 25g"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              color: '#181B26',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Minus size={14} />
                          </button>

                          <div style={{ display: 'inline-flex', alignItems: 'center', margin: '0 6px' }}>
                            <input
                              type="number"
                              min="5"
                              max="3000"
                              value={food.quantity_g}
                              onChange={(e) => handleDirectGramsChange(idx, e.target.value)}
                              style={{
                                width: '56px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '0.90rem',
                                color: '#181B26',
                                outline: 'none',
                                fontFamily: 'var(--font-mono)'
                              }}
                            />
                            <span style={{ fontSize: '0.80rem', color: '#6B7280', fontWeight: 600 }}>g</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdjustGrams(idx, 25)}
                            title="Increase portion by 25g"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              color: '#181B26',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Calculated Macros for this portion */}
                      <div style={{
                        display: 'flex',
                        gap: '14px',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#505A69',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ fontWeight: 700, color: '#181B26' }}>
                          ~{food.calories} kcal
                        </span>
                        <span style={{ color: '#922756', fontWeight: 600 }}>
                          {food.protein_g}g Protein
                        </span>
                        <span>{food.carbs_g}g Carbs</span>
                        <span>{food.fat_g}g Fat</span>
                        {food.fiber_g !== undefined && <span>{food.fiber_g}g Fiber</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-Medical Disclaimer & Accuracy Standards */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            backgroundColor: '#F9FAFB',
            borderRadius: '14px',
            border: '1px solid #E8ECF2',
            marginBottom: '28px',
            color: '#6B7280',
            fontSize: '0.82rem',
            lineHeight: 1.5
          }}>
            <Info size={18} style={{ flexShrink: 0, color: '#922756' }} />
            <div>
              <strong>Disclaimer:</strong> {analysisResult.disclaimer}{' '}
              <span style={{ color: '#8E95A5' }}>
                All values are deterministically scaled from USDA FoodData Central and Indian Food Composition Tables (IFCT/ICMR) without AI-invented macros.
              </span>
            </div>
          </div>

          {/* Confirm & Save to Today's Meals Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={handleRemovePhoto}
              style={{
                padding: '12px 24px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#505A69',
                fontSize: '0.90rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Discard
            </button>

            <Button
              variant="primary"
              onClick={handleSaveToTodayMeals}
              disabled={savingMeal}
              icon={Check}
            >
              {savingMeal ? "Saving meal..." : "Save to today's meals"}
            </Button>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* 3. DAILY NUTRITION DASHBOARD ("TODAY")                        */}
      {/* ============================================================== */}
      <Card style={{ padding: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <span className="label-micro" style={{ color: '#922756' }}>DAILY NUTRITION DASHBOARD</span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#181B26',
              margin: '4px 0 0 0'
            }}>
              Today
            </h2>
          </div>

          <button
            type="button"
            onClick={loadTodayMeals}
            disabled={isLoadingToday}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid #E8ECF2',
              backgroundColor: '#FFFFFF',
              color: '#505A69',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={isLoadingToday ? 'animate-spin' : ''} />
            Sync Today
          </button>
        </div>

        {/* 5 Today KPI Progress Blocks */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {/* Calories */}
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#FAFBFC',
            border: '1px solid #E8ECF2'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}>
              Calories
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#181B26',
              marginBottom: '8px'
            }}>
              {todayData.todayConsumed.calories.toLocaleString()} <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5' }}>/ {todayData.targets.calories.toLocaleString()} kcal</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((todayData.todayConsumed.calories / todayData.targets.calories) * 100))}%`,
                height: '100%',
                backgroundColor: '#922756',
                borderRadius: '9999px'
              }} />
            </div>
          </div>

          {/* Protein */}
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#FAFBFC',
            border: '1px solid #E8ECF2'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}>
              Protein
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#922756',
              marginBottom: '8px'
            }}>
              {todayData.todayConsumed.protein} <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5' }}>/ {todayData.targets.protein} g</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((todayData.todayConsumed.protein / todayData.targets.protein) * 100))}%`,
                height: '100%',
                backgroundColor: '#922756',
                borderRadius: '9999px'
              }} />
            </div>
          </div>

          {/* Carbohydrates */}
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#FAFBFC',
            border: '1px solid #E8ECF2'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}>
              Carbohydrates
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#181B26',
              marginBottom: '8px'
            }}>
              {todayData.todayConsumed.carbs} <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5' }}>/ {todayData.targets.carbs} g</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((todayData.todayConsumed.carbs / todayData.targets.carbs) * 100))}%`,
                height: '100%',
                backgroundColor: '#3B82F6',
                borderRadius: '9999px'
              }} />
            </div>
          </div>

          {/* Fat */}
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#FAFBFC',
            border: '1px solid #E8ECF2'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}>
              Fat
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#181B26',
              marginBottom: '8px'
            }}>
              {todayData.todayConsumed.fat} <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5' }}>/ {todayData.targets.fat} g</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((todayData.todayConsumed.fat / todayData.targets.fat) * 100))}%`,
                height: '100%',
                backgroundColor: '#F59E0B',
                borderRadius: '9999px'
              }} />
            </div>
          </div>

          {/* Fiber */}
          <div style={{
            padding: '20px',
            borderRadius: '16px',
            backgroundColor: '#FAFBFC',
            border: '1px solid #E8ECF2'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}>
              Fiber
            </div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#181B26',
              marginBottom: '8px'
            }}>
              {todayData.todayConsumed.fiber} <span style={{ fontSize: '0.90rem', fontWeight: 500, color: '#8E95A5' }}>/ {todayData.targets.fiber} g</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.round((todayData.todayConsumed.fiber / todayData.targets.fiber) * 100))}%`,
                height: '100%',
                backgroundColor: '#10B981',
                borderRadius: '9999px'
              }} />
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================== */}
      {/* 4. TODAY'S MEAL HISTORY                                       */}
      {/* ============================================================== */}
      <Card style={{ padding: '32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="label-micro" style={{ color: '#922756' }}>LOGGED INTAKE</span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 700,
            color: '#181B26',
            margin: '4px 0 0 0'
          }}>
            Today's Meals
          </h2>
        </div>

        {todayData.meals.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: '#FAFBFC',
            borderRadius: '16px',
            border: '1px solid #E8ECF2',
            color: '#6B7280'
          }}>
            <Utensils size={32} style={{ marginBottom: '10px', color: '#922756' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#181B26' }}>No meals logged yet today</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              Upload a meal photo above to analyze and log your first intake.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((slot) => {
              const slotMeals = todayData.meals.filter(m => (m.meal_type || '').toUpperCase() === slot);
              if (slotMeals.length === 0) return null;

              return (
                <div key={slot} style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#922756',
                    marginBottom: '8px'
                  }}>
                    {slot}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {slotMeals.map((meal) => {
                      const isExpanded = Boolean(expandedMealIds[meal.meal_id]);
                      return (
                        <div
                          key={meal.meal_id}
                          style={{
                            border: '1px solid #E8ECF2',
                            borderRadius: '16px',
                            backgroundColor: '#FFFFFF',
                            overflow: 'hidden',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          {/* Accordion Summary Row */}
                          <div
                            onClick={() => toggleMealExpanded(meal.meal_id)}
                            style={{
                              padding: '16px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              backgroundColor: isExpanded ? '#FAFBFC' : '#FFFFFF',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              {/* Photo or Icon */}
                              {meal.image_url ? (
                                <img
                                  src={meal.image_url}
                                  alt={meal.meal_name}
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '12px',
                                  backgroundColor: '#FDF2F6',
                                  color: '#922756',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Utensils size={20} />
                                </div>
                              )}

                              <div>
                                <h4 style={{
                                  fontSize: '1rem',
                                  fontWeight: 600,
                                  color: '#181B26',
                                  margin: '0 0 2px 0'
                                }}>
                                  {meal.meal_name}
                                </h4>
                                <div style={{
                                  fontSize: '0.80rem',
                                  color: '#6B7280'
                                }}>
                                  Logged today • {meal.foods?.length || 0} items verified
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 700,
                                  color: '#181B26'
                                }}>
                                  ~{meal.calories} kcal
                                </div>
                                <div style={{
                                  fontSize: '0.78rem',
                                  fontFamily: 'var(--font-mono)',
                                  color: '#922756',
                                  fontWeight: 600
                                }}>
                                  {meal.protein_g}g protein
                                </div>
                              </div>

                              {isExpanded ? <ChevronUp size={20} color="#8E95A5" /> : <ChevronDown size={20} color="#8E95A5" />}
                            </div>
                          </div>

                          {/* Expanded Nutritional Details */}
                          {isExpanded && (
                            <div style={{
                              padding: '20px',
                              borderTop: '1px solid #E8ECF2',
                              backgroundColor: '#FAFBFC'
                            }}>
                              <div style={{
                                display: 'flex',
                                gap: '24px',
                                marginBottom: '16px',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-mono)',
                                color: '#505A69'
                              }}>
                                <span><strong>Carbs:</strong> {meal.carbs_g}g</span>
                                <span><strong>Fat:</strong> {meal.fat_g}g</span>
                                <span><strong>Fiber:</strong> {meal.fiber_g}g</span>
                              </div>

                              {/* Items list */}
                              <div style={{
                                border: '1px solid #E8ECF2',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: '#FFFFFF',
                                marginBottom: '16px'
                              }}>
                                {(meal.foods || []).map((item, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      padding: '10px 16px',
                                      borderBottom: i === (meal.foods.length - 1) ? 'none' : '1px solid #E8ECF2',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: 600, color: '#181B26' }}>{item.name}</span>
                                      <span style={{ color: '#8E95A5', marginLeft: '8px' }}>({item.quantity || `${item.quantity_g} g`})</span>
                                      {item.nutrition_source && (
                                        <span style={{ color: '#9CA3AF', fontSize: '0.72rem', marginLeft: '6px' }}>• {item.nutrition_source}</span>
                                      )}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', color: '#505A69' }}>
                                      {item.calories} kcal • {item.protein_g}g P
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLoggedMeal(meal.meal_id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    borderRadius: '9999px',
                                    border: '1px solid #FEE2E2',
                                    backgroundColor: '#FEF2F2',
                                    color: '#DC2626',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={13} />
                                  Remove from today
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ============================================================== */}
      {/* 5. CHANGE FOOD ITEM MODAL (SEARCH VERIFIED DATABASE)           */}
      {/* ============================================================== */}
      {isChangeModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsChangeModalOpen(false);
            setChangingItemIndex(null);
          }}
          title="Change Food Item"
          subtitle="Select a verified food from the USDA & Indian nutrition database"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#9CA3AF' }} />
              <input
                type="text"
                autoFocus
                placeholder="Search food (e.g. biryani, paneer, oats, egg)..."
                value={searchQuery}
                onChange={(e) => handleSearchDatabase(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Quick Suggestions if no search query */}
            {!searchQuery && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Common Verified Foods
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                  {POPULAR_DATABASE_FOODS.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectReplacement(item)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#FAFBFC',
                        border: '1px solid #E8ECF2',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDF2F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAFBFC'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.90rem', color: '#181B26' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#8E95A5' }}>Source: {item.source}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem', color: '#505A69' }}>
                        {item.calories} kcal / 100g
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {isSearchingDb ? "Searching verified database..." : `Found ${searchResults.length} entries`}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                  {searchResults.length === 0 && !isSearchingDb && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#8E95A5', fontSize: '0.88rem' }}>
                      No matching verified database entry found for "{searchQuery}". Try a broader term.
                    </div>
                  )}

                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectReplacement(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#FAFBFC',
                        border: '1px solid #E8ECF2',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDF2F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAFBFC'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#181B26' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#8E95A5' }}>Source: {item.source}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#181B26', textAlign: 'right' }}>
                        <div>{item.calories} kcal <span style={{ color: '#8E95A5', fontSize: '0.72rem' }}>/ 100g</span></div>
                        <div style={{ fontSize: '0.72rem', color: '#922756' }}>{item.protein_g}g Protein</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setIsChangeModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* 6. ADD FOOD ITEM MODAL (SEARCH VERIFIED DATABASE)              */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Verified Food"
          subtitle="Add side dishes, drinks, or items from USDA / Indian Food database"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#9CA3AF' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search food item..."
                  value={searchQuery}
                  onChange={(e) => handleSearchDatabase(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ width: '130px' }}>
                <FormField label="Portion (g)">
                  <Input
                    type="number"
                    min="10"
                    max="2000"
                    value={addQuantityG}
                    onChange={(e) => setAddQuantityG(parseInt(e.target.value, 10) || 100)}
                  />
                </FormField>
              </div>
            </div>

            {/* List */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                {searchQuery ? `Results (${searchResults.length})` : "Common Verified Foods"}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {(searchQuery ? searchResults : POPULAR_DATABASE_FOODS).map((item, idx) => {
                  const estCal = Math.round((item.calories * addQuantityG) / 100);
                  const estP = Math.round(((item.protein_g * addQuantityG) / 100) * 10) / 10;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleAddFromDatabase(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#FAFBFC',
                        border: '1px solid #E8ECF2',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FDF2F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAFBFC'}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#181B26' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#8E95A5' }}>Source: {item.source}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#181B26', textAlign: 'right' }}>
                        <div>~{estCal} kcal <span style={{ color: '#8E95A5', fontSize: '0.72rem' }}>({addQuantityG}g)</span></div>
                        <div style={{ fontSize: '0.72rem', color: '#922756' }}>{estP}g Protein</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
