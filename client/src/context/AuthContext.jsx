import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { 
  INITIAL_PERSONAS, 
  INITIAL_EQUIPMENT, 
  INITIAL_WORKOUT_PLAN, 
  INITIAL_DIET_PLAN, 
  INITIAL_BMI_HISTORY, 
  INITIAL_PROGRESS_LOGS, 
  INITIAL_TRAINER, 
  INITIAL_TRAINER_MESSAGES, 
  INITIAL_SUPPLEMENTS, 
  INITIAL_NOTIFICATIONS 
} from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Active User State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fitcommit_mock_user');
    return saved ? JSON.parse(saved) : INITIAL_PERSONAS[0]; // Default to Hemanth (Base Member)
  });

  const [equipmentList, setEquipmentList] = useState(INITIAL_EQUIPMENT);
  const [workoutPlan, setWorkoutPlan] = useState(INITIAL_WORKOUT_PLAN);
  const [dietPlan, setDietPlan] = useState(INITIAL_DIET_PLAN);
  const [bmiHistory, setBmiHistory] = useState(INITIAL_BMI_HISTORY);
  const [progressLogs, setProgressLogs] = useState(INITIAL_PROGRESS_LOGS);
  const [trainerMessages, setTrainerMessages] = useState(INITIAL_TRAINER_MESSAGES);
  const [assignedTrainer, setAssignedTrainer] = useState(INITIAL_TRAINER);
  const [supplementOffers, setSupplementOffers] = useState(INITIAL_SUPPLEMENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [backendConnected, setBackendConnected] = useState(false);

  // Sync to local storage for offline continuity
  useEffect(() => {
    if (user) {
      localStorage.setItem('fitcommit_mock_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fitcommit_mock_user');
    }
  }, [user]);

  // Load all user data from backend
  const loadAllUserData = useCallback(async () => {
    try {
      // 1. Equipment list (live IoT state)
      const eqData = await api.getAllEquipment().catch(() => null);
      if (eqData && eqData.equipment && eqData.equipment.length > 0) {
        setEquipmentList(eqData.equipment);
      }

      // 2. Workout Plan & Adaptive Rule
      const wpData = await api.getCurrentWorkout().catch(() => null);
      if (wpData && wpData.workout) {
        setWorkoutPlan({
          plan_id: wpData.workout.plan_id,
          plan_name: wpData.workout.plan_name,
          target_goal: wpData.workout.target_goal,
          difficulty_level: wpData.workout.difficulty_level,
          is_completed_today: wpData.workout.is_completed_today || false,
          completed_this_week: wpData.workout.completed_this_week || 3,
          target_this_week: wpData.workout.target_this_week || 4,
          commitment_score: wpData.workout.commitment_score || 82,
          adaptive_volume_scale: wpData.rule?.volume_scaling_factor || 1.08,
          rule_description: wpData.rule?.rule_description || 'Adaptive volume scaled by 1.08x upon 80%+ dedication.',
          schedule: wpData.workout.schedule || INITIAL_WORKOUT_PLAN.schedule
        });
      }

      // 3. Diet Plan & Macros
      const dpData = await api.getDietPlan().catch(() => null);
      if (dpData && dpData.plan) {
        setDietPlan({
          diet_id: dpData.plan.diet_id,
          plan_name: dpData.plan.plan_name,
          dietary_preference: dpData.plan.dietary_preference,
          calorie_target: dpData.plan.calorie_target,
          macros: dpData.plan.macros || { protein: 145, carbs: 235, fat: 58 },
          consumed_today: dpData.plan.consumed_today || { calories: 1840, protein: 122, carbs: 195, fat: 48 },
          meal_structure: dpData.plan.meal_structure || INITIAL_DIET_PLAN.meal_structure
        });
      }

      // 4. BMI History
      const bmiData = await api.getBMIHistory().catch(() => null);
      if (bmiData && bmiData.history && bmiData.history.length > 0) {
        setBmiHistory(bmiData.history);
      }

      // 5. Progress Logs
      const progData = await api.getProgressAnalytics().catch(() => null);
      if (progData && progData.logs && progData.logs.length > 0) {
        setProgressLogs(progData.logs);
      }

      // 6. Assigned Trainer & Messages
      const trData = await api.getAssignedTrainer().catch(() => null);
      if (trData && trData.trainer) {
        setAssignedTrainer(trData.trainer);
      }
      const msgData = await api.getTrainerMessages().catch(() => null);
      if (msgData && msgData.messages && msgData.messages.length > 0) {
        setTrainerMessages(msgData.messages);
      }

      // 7. Supplement offers
      const suppData = await api.getSupplementOffers().catch(() => null);
      if (suppData && suppData.offers && suppData.offers.length > 0) {
        setSupplementOffers(suppData.offers);
      }

      // 8. Notifications
      const notifData = await api.getNotifications().catch(() => null);
      if (notifData && notifData.notifications && notifData.notifications.length > 0) {
        setNotifications(notifData.notifications);
      }

      setBackendConnected(true);
    } catch (err) {
      console.warn('Backend data sync notice:', err.message);
    }
  }, []);

  // Rehydrate session from stored JWT or perform initial login
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('fitcommit_token');
      if (token) {
        try {
          const meData = await api.getMe();
          if (meData && meData.user) {
            setUser(meData.user);
            await loadAllUserData();
            return;
          }
        } catch {
          // Token expired or invalid, fallback below
          localStorage.removeItem('fitcommit_token');
        }
      }

      // Connect with demo base persona initially
      try {
        const demoRes = await api.demoLogin('base');
        if (demoRes && demoRes.token) {
          localStorage.setItem('fitcommit_token', demoRes.token);
          setUser(demoRes.user);
          await loadAllUserData();
        }
      } catch {
        // Run with mock data if backend not yet ready
      }
    };

    initSession();
  }, [loadAllUserData]);

  // Quick Persona Switcher (Roles: Base, Premium, Trainer, Admin)
  const demoLogin = async (roleKey) => {
    try {
      const data = await api.demoLogin(roleKey);
      if (data && data.token) {
        localStorage.setItem('fitcommit_token', data.token);
        setUser(data.user);
        await loadAllUserData();
        return data.user;
      }
    } catch (err) {
      console.warn('Using client fallback for persona demo:', err.message);
    }

    // Local fallback
    let target = INITIAL_PERSONAS[0];
    if (roleKey === 'premium') target = INITIAL_PERSONAS[1];
    else if (roleKey === 'trainer') target = INITIAL_PERSONAS[2];
    else if (roleKey === 'admin') target = INITIAL_PERSONAS[3];

    setUser(target);
    return target;
  };

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      if (data && data.token) {
        localStorage.setItem('fitcommit_token', data.token);
        setUser(data.user);
        await loadAllUserData();
        return data.user;
      }
    } catch (err) {
      // Re-throw if invalid credentials so UI can display message
      if (err.status === 401 || err.status === 404) {
        throw err;
      }
      console.warn('Falling back to local login:', err.message);
    }

    const found = INITIAL_PERSONAS.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      return found;
    }

    const custom = {
      user_id: 99,
      name: email.split('@')[0],
      email,
      role: 'BASE_MEMBER',
      height: 175,
      weight: 70,
      fitness_goal: 'General Fitness',
      account_status: 'ACTIVE',
      membership: {
        membership_id: 1,
        membership_name: 'Base Commitment Tier',
        tier: 'BASE',
        price: 0.0,
        subscription_status: 'VALID',
        gym_access: false
      }
    };
    setUser(custom);
    return custom;
  };

  const register = async (formData) => {
    try {
      const data = await api.register(formData);
      if (data && data.token) {
        localStorage.setItem('fitcommit_token', data.token);
        setUser(data.user);
        await loadAllUserData();
        return data.user;
      }
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        throw err;
      }
      console.warn('Falling back to local register:', err.message);
    }

    const newUser = {
      user_id: Date.now(),
      name: formData.name,
      email: formData.email,
      role: formData.role || 'BASE_MEMBER',
      height: parseFloat(formData.height) || 175,
      weight: parseFloat(formData.weight) || 70,
      fitness_goal: formData.fitness_goal || 'Muscle Gain',
      account_status: 'ACTIVE',
      membership: {
        membership_id: formData.role === 'PREMIUM_MEMBER' ? 2 : 1,
        membership_name: formData.role === 'PREMIUM_MEMBER' ? 'Premium Smart Pass' : 'Base Commitment Tier',
        tier: formData.role === 'PREMIUM_MEMBER' ? 'PREMIUM' : 'BASE',
        price: formData.role === 'PREMIUM_MEMBER' ? 29.0 : 0.0,
        subscription_status: 'VALID',
        gym_access: formData.role === 'PREMIUM_MEMBER'
      }
    };
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fitcommit_token');
    localStorage.removeItem('fitcommit_mock_user');
  };

  const updateUserProfile = async (updatedFields) => {
    try {
      const res = await api.updateProfile(updatedFields);
      if (res && res.user) {
        setUser(res.user);
        if (res.bmiRecord) {
          setBmiHistory(prev => [...prev, res.bmiRecord]);
        }
        if (res.dietPlan) {
          setDietPlan(prev => ({
            ...prev,
            calorie_target: res.dietPlan.calorie_target,
            macros: res.dietPlan.macros
          }));
        }
        return res.user;
      }
    } catch (err) {
      console.warn('Updating profile locally:', err.message);
    }

    // Local recalculation fallback
    const updated = {
      ...user,
      ...updatedFields,
      height: parseFloat(updatedFields.height) || user.height,
      weight: parseFloat(updatedFields.weight) || user.weight
    };
    setUser(updated);

    // Auto-recalculate BMI and macros based on biometric updates
    const hM = updated.height / 100;
    const newBMI = +(updated.weight / (hM * hM)).toFixed(2);
    let cat = 'Normal Weight';
    if (newBMI < 18.5) cat = 'Underweight';
    else if (newBMI >= 25 && newBMI < 30) cat = 'Overweight';
    else if (newBMI >= 30) cat = 'Obese';

    setBmiHistory(prev => [
      ...prev,
      {
        bmi_id: prev.length + 1,
        record_date: new Date().toISOString().split('T')[0],
        height: updated.height,
        weight: updated.weight,
        bmi_value: newBMI,
        category: cat
      }
    ]);

    const bmr = 10 * updated.weight + 6.25 * updated.height - 5 * 24 + 5;
    const tdee = Math.round(bmr * 1.4);
    const protein = Math.round(updated.weight * 2.0);
    const fat = Math.round((tdee * 0.28) / 9);
    const carbs = Math.max(150, Math.round((tdee - (protein * 4 + fat * 9)) / 4));

    setDietPlan(prev => ({
      ...prev,
      calorie_target: tdee,
      macros: { protein, carbs, fat }
    }));
    return updated;
  };

  const upgradeToPremium = async () => {
    try {
      const res = await api.subscribeMembership('PREMIUM');
      if (res && res.user) {
        setUser(res.user);
        await loadAllUserData();
        return;
      }
    } catch (err) {
      console.warn('Membership upgrade local fallback:', err.message);
    }

    const updated = {
      ...user,
      role: 'PREMIUM_MEMBER',
      membership: {
        membership_id: 2,
        membership_name: 'Premium Smart Pass',
        tier: 'PREMIUM',
        price: 29.0,
        subscription_status: 'VALID',
        gym_access: true
      }
    };
    setUser(updated);
  };

  const completeTodayWorkout = async (calories = 510) => {
    try {
      const res = await api.completeWorkout({ calories_burned: calories });
      if (res && res.success) {
        setWorkoutPlan(prev => ({
          ...prev,
          is_completed_today: true,
          completed_this_week: res.completed_this_week || prev.completed_this_week + 1,
          commitment_score: res.commitment_score || prev.commitment_score + 4
        }));

        if (res.log) {
          setProgressLogs(prev => [res.log, ...prev]);
        }
        return;
      }
    } catch (err) {
      console.warn('Completing workout local fallback:', err.message);
    }

    setWorkoutPlan(prev => ({
      ...prev,
      is_completed_today: true,
      completed_this_week: Math.min(prev.target_this_week, prev.completed_this_week + 1),
      commitment_score: Math.min(100, prev.commitment_score + 4)
    }));

    setProgressLogs(prev => [
      {
        log_date: new Date().toISOString().split('T')[0],
        calories_burned: calories,
        steps: 8850,
        workout_completed: true,
        notes: 'Today session completed.'
      },
      ...prev
    ]);
  };

  const toggleEquipmentSensor = async (eqId) => {
    try {
      const res = await api.toggleEquipmentSensor(eqId);
      if (res && res.equipment) {
        setEquipmentList(prev => prev.map(eq => 
          eq.equipment_id === eqId ? { ...eq, ...res.equipment } : eq
        ));
        return res.equipment;
      }
    } catch (err) {
      console.warn('Sensor toggle local fallback:', err.message);
    }

    setEquipmentList(prev => prev.map(eq => {
      if (eq.equipment_id === eqId) {
        const nextStatus = eq.occupancy_status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
        return {
          ...eq,
          occupancy_status: nextStatus,
          last_updated: 'Just now'
        };
      }
      return eq;
    }));
  };

  const sendTrainerMessage = async (text) => {
    try {
      const res = await api.sendTrainerMessage(text);
      if (res && res.sent) {
        setTrainerMessages(prev => [...prev, res.sent]);
        return res.sent;
      }
    } catch (err) {
      console.warn('Trainer message local fallback:', err.message);
    }

    const msg = {
      message_id: trainerMessages.length + 1,
      sender_role: 'USER',
      message_text: text,
      sent_at: 'Just now'
    };
    setTrainerMessages(prev => [...prev, msg]);
    return msg;
  };

  const isPremium = user?.role === 'PREMIUM_MEMBER' || user?.role === 'TRAINER' || user?.role === 'ADMIN';
  const isBase = user?.role === 'BASE_MEMBER';
  const isTrainer = user?.role === 'TRAINER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      equipmentList,
      workoutPlan,
      dietPlan,
      bmiHistory,
      progressLogs,
      trainerMessages,
      assignedTrainer,
      supplementOffers,
      notifications,
      backendConnected,
      isPremium,
      isBase,
      isTrainer,
      isAdmin,
      login,
      demoLogin,
      register,
      logout,
      updateUserProfile,
      upgradeToPremium,
      completeTodayWorkout,
      toggleEquipmentSensor,
      sendTrainerMessage,
      refreshData: loadAllUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
