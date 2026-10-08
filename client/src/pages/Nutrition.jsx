import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, CardHeader, MetricCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { FormField, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { MacroBar } from '../components/ProgressIndicator';
import { Plus, Flame, Utensils, Sparkles, SlidersHorizontal, Apple } from 'lucide-react';
import AiMealAnalyzer from '../components/AiMealAnalyzer';

export default function Nutrition({ setActivePage }) {
  const { dietPlan } = useAuth();
  const { showToast } = useNotifications();

  // Navigation tab state: 'ai-analyzer' or 'diet-protocol'
  const [activeTab, setActiveTab] = useState('ai-analyzer');

  const [modalOpen, setModalOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    title: '',
    calories: 320,
    protein: 24,
    carbs: 35,
    fat: 10
  });

  const [aiCustomDiet, setAiCustomDiet] = useState(null);
  const [dietaryPref, setDietaryPref] = useState('Omnivore');
  const [recalibrating, setRecalibrating] = useState(false);

  const activeDiet = aiCustomDiet || dietPlan;
  const [consumed, setConsumed] = useState(activeDiet.consumed_today);

  // Sync consumed intake when meal is saved or targets loaded
  const refreshConsumedFromApi = async () => {
    try {
      const data = await api.getMacroTargets();
      if (data && data.todayConsumed) {
        setConsumed(data.todayConsumed);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    refreshConsumedFromApi();
  }, []);

  const handleRecalculateAi = async (pref) => {
    setRecalibrating(true);
    setDietaryPref(pref);
    try {
      const [dietRes, macroRes] = await Promise.all([
        api.getDietRecommendation({ dietary_preference: pref }),
        api.getMacroRecommendation({ dietary_preference: pref })
      ]);
      if (dietRes && macroRes) {
        setAiCustomDiet({
          ...dietPlan,
          plan_name: dietRes.plan_name,
          dietary_preference: pref,
          calorie_target: macroRes.target_calories || dietRes.calorie_target,
          macros: {
            protein: macroRes.macros.protein_grams,
            carbs: macroRes.macros.carb_grams,
            fat: macroRes.macros.fat_grams
          },
          meal_structure: dietRes.meal_structure,
          bmi_category: macroRes.bmi_category,
          tdee: macroRes.tdee_calories
        });
        showToast(`AI partitioned macros for ${pref} (${macroRes.target_calories} kcal).`, 'AI Nutrition Calibrated');
      }
    } catch (err) {
      console.warn('AI Nutrition note:', err.message);
    } finally {
      setRecalibrating(false);
    }
  };

  const handleSaveMeal = async (e) => {
    e.preventDefault();
    setConsumed(prev => ({
      calories: prev.calories + parseInt(mealForm.calories || 0),
      protein: prev.protein + parseInt(mealForm.protein || 0),
      carbs: prev.carbs + parseInt(mealForm.carbs || 0),
      fat: prev.fat + parseInt(mealForm.fat || 0)
    }));

    showToast(`Logged '${mealForm.title || 'Snack'}' (${mealForm.calories} kcal).`, 'Meal Added');
    setModalOpen(false);

    try {
      await api.logMeal({
        calories: parseInt(mealForm.calories || 0),
        protein_g: parseInt(mealForm.protein || 0),
        carbs_g: parseInt(mealForm.carbs || 0),
        fat_g: parseInt(mealForm.fat || 0),
        meal_name: mealForm.title || 'Logged Meal'
      });
      refreshConsumedFromApi();
    } catch {
      // offline fallback
    }
  };

  const remaining = {
    calories: Math.max(0, activeDiet.calorie_target - consumed.calories),
    protein: Math.max(0, activeDiet.macros.protein - consumed.protein),
    carbs: Math.max(0, activeDiet.macros.carbs - consumed.carbs),
    fat: Math.max(0, activeDiet.macros.fat - consumed.fat)
  };

  const meals = activeDiet.meal_structure || {};

  return (
    <div className="page-container" style={{ padding: '40px 32px' }}>
      {/* 1. Page Header & Segmented Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div>
          <span className="label-micro" style={{ color: '#922756' }}>FITCOMMIT INTELLIGENT NUTRITION</span>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.4rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginTop: '6px',
            color: '#181B26'
          }}>
            Nutrition & Meal Tracking
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            AI vision meal tracking and Mifflin-St Jeor biometric macronutrient partitioning.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: '#FAFBFC',
          border: '1px solid #E8ECF2',
          borderRadius: '9999px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('ai-analyzer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'ai-analyzer' ? '#922756' : 'transparent',
              color: activeTab === 'ai-analyzer' ? '#FFFFFF' : '#505A69',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={16} />
            AI Meal Analyzer
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diet-protocol')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'diet-protocol' ? '#922756' : 'transparent',
              color: activeTab === 'diet-protocol' ? '#FFFFFF' : '#505A69',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <SlidersHorizontal size={16} />
            Diet Protocol & Targets
          </button>
        </div>
      </div>

      {/* 2. TAB 1: AI MEAL ANALYZER */}
      {activeTab === 'ai-analyzer' && (
        <AiMealAnalyzer onMealSaved={refreshConsumedFromApi} />
      )}

      {/* 3. TAB 2: TRADITIONAL DIET PROTOCOL & TARGETS */}
      {activeTab === 'diet-protocol' && (
        <div>
          {/* Subheader with AI Dietary Preference Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
            padding: '16px 20px',
            backgroundColor: '#FAFBFC',
            borderRadius: '16px',
            border: '1px solid #E8ECF2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#181B26' }}>Macro Goal Preset:</span>
              {['Omnivore', 'Vegetarian', 'Vegan'].map((pref) => (
                <button
                  key={pref}
                  onClick={() => handleRecalculateAi(pref)}
                  disabled={recalibrating}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: dietaryPref === pref ? '1px solid #922756' : '1px solid #E8ECF2',
                    backgroundColor: dietaryPref === pref ? '#922756' : '#FFFFFF',
                    color: dietaryPref === pref ? '#FFFFFF' : '#505A69',
                    fontSize: '0.80rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {pref}
                </button>
              ))}
              {recalibrating && <span style={{ fontSize: '12px', color: '#8E95A5' }}>Calibrating...</span>}
            </div>

            <Button onClick={() => setModalOpen(true)} icon={Plus}>
              Manual Quick Entry
            </Button>
          </div>

          {/* Macro KPI Grid */}
          <div className="grid-4" style={{ marginBottom: '32px' }}>
            <MetricCard
              label="Daily Calorie Budget"
              value={dietPlan.calorie_target}
              unit="kcal"
              subtitle={`${remaining.calories} kcal remaining`}
              icon={Flame}
            />
            <MetricCard
              label="Target Protein"
              value={dietPlan.macros.protein}
              unit="g"
              subtitle={`${remaining.protein}g remaining`}
              icon={Utensils}
            />
            <MetricCard
              label="Carbohydrates"
              value={dietPlan.macros.carbs}
              unit="g"
              subtitle={`${remaining.carbs}g remaining`}
              icon={Utensils}
            />
            <MetricCard
              label="Healthy Fats"
              value={dietPlan.macros.fat}
              unit="g"
              subtitle={`${remaining.fat}g remaining`}
              icon={Utensils}
            />
          </div>

          {/* Daily Nutrient Progress Card */}
          <Card style={{ marginBottom: '32px' }}>
            <CardHeader
              subtitle="Energy Expenditure Allocation"
              title="Today's Macro Intake"
              badge={<Badge variant="outline">Mifflin-St Jeor Calculation</Badge>}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <MacroBar
                label="Protein (Lean Muscle Protein Synthesis)"
                current={consumed.protein}
                target={dietPlan.macros.protein}
                subtext={`${remaining.protein}g remaining`}
              />
              <MacroBar
                label="Carbohydrates (Glycogen Replenishment)"
                current={consumed.carbs}
                target={dietPlan.macros.carbs}
                subtext={`${remaining.carbs}g remaining`}
              />
              <MacroBar
                label="Healthy Fats (Hormonal Balance & Joints)"
                current={consumed.fat}
                target={dietPlan.macros.fat}
                subtext={`${remaining.fat}g remaining`}
              />
            </div>
          </Card>

          {/* Meal Recommendations */}
          <Card style={{ marginBottom: '32px' }}>
            <CardHeader
              subtitle="Meal Recommendations"
              title={dietPlan.diet_name}
              badge={<Badge variant="dark">AI Formulated</Badge>}
            />

            <div className="grid-2">
              {Object.entries(meals).map(([mealType, meal], idx) => (
                <Card key={idx} padding="tight" style={{ backgroundColor: '#FAFBFC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="label-micro" style={{ textTransform: 'capitalize' }}>{mealType}</span>
                    <Badge variant="dark">{meal.calories} kcal</Badge>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{meal.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {meal.description}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Manual Log Meal Modal */}
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Log Meal or Snack"
            subtitle="Manual Nutritional Intake Entry"
          >
            <form onSubmit={handleSaveMeal}>
              <FormField label="Meal Name">
                <Input
                  required
                  placeholder="e.g. Nordic Skyr with Berries"
                  value={mealForm.title}
                  onChange={(e) => setMealForm({ ...mealForm, title: e.target.value })}
                />
              </FormField>

              <FormField label="Calories (kcal)">
                <Input
                  type="number"
                  required
                  value={mealForm.calories}
                  onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                />
              </FormField>

              <div className="grid-3">
                <FormField label="Protein (g)">
                  <Input
                    type="number"
                    value={mealForm.protein}
                    onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                  />
                </FormField>

                <FormField label="Carbs (g)">
                  <Input
                    type="number"
                    value={mealForm.carbs}
                    onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                  />
                </FormField>

                <FormField label="Fat (g)">
                  <Input
                    type="number"
                    value={mealForm.fat}
                    onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })}
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Intake</Button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
