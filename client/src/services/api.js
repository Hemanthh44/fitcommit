import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('fitcommit_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // 1. Auth & Profiles
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: (role) => request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request('/auth/me'),
  getProfile: () => request('/users/profile'),
  updateProfile: (profileData) => request('/users/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // 2. BMI
  getBMIHistory: () => request('/bmi'),
  calculateBMI: (data) => request('/bmi', { method: 'POST', body: JSON.stringify(data) }),

  // 3. Nutrition, Diet & AI Meal Analyzer
  getDietPlan: () => request('/nutrition/plan'),
  getMacroTargets: () => request('/nutrition/macros'),
  logMeal: (mealData) => request('/nutrition/log', { method: 'POST', body: JSON.stringify(mealData) }),
  analyzeMeal: (formData) => request('/nutrition/analyze-meal', { method: 'POST', body: formData }),
  saveMealRecord: (mealData) => request('/nutrition/meals', { method: 'POST', body: JSON.stringify(mealData) }),
  getTodayMeals: () => request('/nutrition/meals/today'),
  deleteMealRecord: (id) => request(`/nutrition/meals/${id}`, { method: 'DELETE' }),
  searchNutritionDatabase: (query = '') => request(`/nutrition/foods?q=${encodeURIComponent(query)}`),
  calculatePortionNutrition: (foodId, quantityG) => request('/nutrition/calculate-portion', { method: 'POST', body: JSON.stringify({ food_id: foodId, quantity_g: quantityG }) }),



  // 4. Adaptive Workouts
  getCurrentWorkout: () => request('/workouts/current'),
  completeWorkout: (data) => request('/workouts/complete', { method: 'POST', body: JSON.stringify(data || {}) }),
  getWorkoutHistory: () => request('/workouts/history'),

  // 5. Progress & Analytics
  getProgressAnalytics: () => request('/progress/analytics'),
  logActivity: (data) => request('/progress/log', { method: 'POST', body: JSON.stringify(data) }),

  // 6. Smart Gym Equipment & IoT
  getAllEquipment: () => request('/equipment'),
  toggleEquipmentSensor: (id, data) => request(`/equipment/${id}/toggle-sensor`, { method: 'POST', body: JSON.stringify(data || {}) }),
  getEquipmentAlternatives: (id) => request(`/equipment/${id}/alternatives`),

  // 7. Personal Trainer
  getAssignedTrainer: () => request('/trainers/assigned'),
  getTrainerMessages: () => request('/trainers/messages'),
  sendTrainerMessage: (messageText) => request('/trainers/messages', { method: 'POST', body: JSON.stringify({ message_text: messageText }) }),
  getAllTrainers: () => request('/trainers/all'),

  // 8. Memberships & Payments
  getMembershipPlans: () => request('/membership/plans'),
  subscribeMembership: (planTier) => request('/membership/subscribe', { method: 'POST', body: JSON.stringify({ membership_tier: planTier }) }),
  getCurrentSubscription: () => request('/membership/current'),

  // 9. Supplement Discounts
  getSupplementOffers: () => request('/supplements/offers'),
  redeemSupplement: (discountId) => request('/supplements/redeem', { method: 'POST', body: JSON.stringify({ discount_id: discountId }) }),

  // 10. Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  // 11. Admin
  getAdminMetrics: () => request('/admin/metrics'),
  getAdminUsers: () => request('/admin/users'),
  updateAdminUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateEquipmentAdmin: (id, status) => request(`/admin/equipment/${id}`, { method: 'PUT', body: JSON.stringify({ occupancy_status: status }) }),

  // 12. Modular AI Recommendations
  getWorkoutRecommendation: (params = {}) => request('/recommendations/workout', { method: 'POST', body: JSON.stringify(params) }),
  getDietRecommendation: (params = {}) => request('/recommendations/diet', { method: 'POST', body: JSON.stringify(params) }),
  getMacroRecommendation: (params = {}) => request('/recommendations/macros', { method: 'POST', body: JSON.stringify(params) }),
  getAlternativeExercises: (params = {}) => request('/recommendations/alternatives', { method: 'POST', body: JSON.stringify(params) }),
  getMyRecommendations: () => request('/recommendations/my-recommendations'),

  // 13. QR-Based Gym Check-In & Occupancy Tracking
  gymCheckIn: (payload) => {
    let body = {};
    if (typeof payload === 'string') {
      body = { gymId: payload, gymIdentifier: payload };
    } else {
      const gid = payload.gymId || payload.gymIdentifier || payload.qr_code || 'FITCOMMIT-GYM-001';
      body = { gymId: gid, gymIdentifier: gid, ...payload };
    }
    return request('/gym/check-in', { method: 'POST', body: JSON.stringify(body) });
  },
  gymCheckOut: () => request('/gym/check-out', { method: 'POST' }),
  getGymOccupancy: () => request('/gym/occupancy'),
  resetGymDemo: () => request('/gym/reset-demo', { method: 'POST' }),
  getMyGymAttendance: () => request('/gym/my-attendance'),
  getAdminGymOccupancy: () => request('/admin/gym/occupancy'),
  getAdminGymAttendance: () => request('/admin/gym/attendance'),
};

