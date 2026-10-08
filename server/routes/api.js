const express = require('express');
const router = express.Router();

const { authenticateToken, optionalAuthToken } = require('../middleware/authMiddleware');
const { requireRole, requirePremium } = require('../middleware/roleMiddleware');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const bmiController = require('../controllers/bmiController');
const nutritionController = require('../controllers/nutritionController');
const workoutController = require('../controllers/workoutController');
const progressController = require('../controllers/progressController');
const equipmentController = require('../controllers/equipmentController');
const trainerController = require('../controllers/trainerController');
const membershipController = require('../controllers/membershipController');
const supplementController = require('../controllers/supplementController');
const notificationController = require('../controllers/notificationController');
const adminController = require('../controllers/adminController');
const gymController = require('../controllers/gymController');
const { recommendationController } = require('../controllers/recommendationController');

// 1. Auth routes (Public)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/demo-login', authController.demoLogin);
router.get('/auth/me', authenticateToken, authController.getMe);

// 2. Profile routes (Authenticated)
router.get('/users/profile', authenticateToken, userController.getProfile);
router.put('/users/profile', authenticateToken, userController.updateProfile);

// 3. BMI routes (Authenticated)
router.get('/bmi', authenticateToken, bmiController.getBMIHistory);
router.post('/bmi', authenticateToken, bmiController.calculateAndLogBMI);

const multer = require('multer');

// Secure in-memory multer storage with strict 10MB limit and MIME validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype?.toLowerCase())) {
      cb(null, true);
    } else {
      const err = new Error('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      err.status = 400;
      cb(err, false);
    }
  }
});

// 4. Nutrition routes (Authenticated & AI Meal Analyzer)
router.get('/nutrition/plan', authenticateToken, nutritionController.getDietPlan);
router.get('/nutrition/macros', authenticateToken, nutritionController.getMacroTargets);
router.post('/nutrition/log', authenticateToken, nutritionController.logMeal);
router.post('/nutrition/analyze-meal', optionalAuthToken, upload.single('image'), nutritionController.analyzeMeal);
router.post('/nutrition/meals', authenticateToken, nutritionController.saveMeal);
router.get('/nutrition/meals/today', authenticateToken, nutritionController.getTodayMeals);
router.delete('/nutrition/meals/:id', authenticateToken, nutritionController.deleteMeal);
router.get('/nutrition/foods', optionalAuthToken, nutritionController.searchFoods);
router.post('/nutrition/calculate-portion', optionalAuthToken, nutritionController.calculatePortion);



// 5. Workout routes (Authenticated)
router.get('/workouts/current', authenticateToken, workoutController.getCurrentPlan);
router.post('/workouts/complete', authenticateToken, workoutController.completeTodayWorkout);
router.get('/workouts/history', authenticateToken, workoutController.getWorkoutHistory);

// 6. Progress routes (Authenticated)
router.get('/progress/analytics', authenticateToken, progressController.getAnalytics);
router.post('/progress/log', authenticateToken, progressController.logActivity);

// 7. Membership & Subscription routes (Authenticated)
router.get('/membership/plans', membershipController.getPlans);
router.post('/membership/subscribe', authenticateToken, membershipController.subscribe);
router.get('/membership/current', authenticateToken, membershipController.getCurrent);

// 8. Notifications routes (Authenticated)
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);

// 9. Smart Equipment & IoT Sensor routes (Premium Protected)
router.get('/equipment', authenticateToken, equipmentController.getAllEquipment);
router.post('/equipment/:id/toggle-sensor', authenticateToken, equipmentController.toggleSensorStatus);
router.get('/equipment/:id/alternatives', authenticateToken, equipmentController.getAlternatives);

// 10. Trainer routes (Premium Protected)
router.get('/trainers/assigned', authenticateToken, requirePremium, trainerController.getAssignedTrainer);
router.get('/trainers/messages', authenticateToken, requirePremium, trainerController.getMessages);
router.post('/trainers/messages', authenticateToken, requirePremium, trainerController.sendMessage);
router.get('/trainers/all', authenticateToken, trainerController.listTrainers);

// 11. Supplement Discounts (Premium Protected)
router.get('/supplements/offers', authenticateToken, requirePremium, supplementController.getOffers);
router.post('/supplements/redeem', authenticateToken, requirePremium, supplementController.redeemCode);

// 12. Admin routes (Admin Protected)
router.get('/admin/metrics', authenticateToken, requireRole('ADMIN'), adminController.getMetrics);
router.get('/admin/users', authenticateToken, requireRole('ADMIN'), adminController.getAllUsers);
router.put('/admin/users/:id', authenticateToken, requireRole('ADMIN'), adminController.updateUser);
router.put('/admin/equipment/:id', authenticateToken, requireRole('ADMIN'), adminController.updateEquipmentStatus);

// 13. Modular AI Recommendation Service routes (Authenticated)
router.post('/recommendations/workout', authenticateToken, recommendationController.getWorkoutRecommendation);
router.post('/recommendations/diet', authenticateToken, recommendationController.getDietRecommendation);
router.post('/recommendations/macros', authenticateToken, recommendationController.getMacroRecommendation);
router.post('/recommendations/alternatives', authenticateToken, recommendationController.getAlternativeExercises);
router.get('/recommendations/my-recommendations', authenticateToken, recommendationController.getComprehensiveRecommendation);

// 14. QR-Based Gym Attendance & Occupancy Routes
router.post('/gym/check-in', authenticateToken, gymController.checkIn);
router.post('/gym/check-out', authenticateToken, gymController.checkOut);
router.get('/gym/occupancy', optionalAuthToken, gymController.getOccupancy);
router.get('/gym/my-attendance', authenticateToken, gymController.getMyAttendance);
router.post('/gym/reset-demo', gymController.resetDemo);

// 15. Admin Gym Occupancy & Attendance Management (Admin Protected)
router.get('/admin/gym/occupancy', authenticateToken, requireRole('ADMIN'), gymController.getAdminOccupancy);
router.get('/admin/gym/attendance', authenticateToken, requireRole('ADMIN'), gymController.getAdminAttendance);

module.exports = router;
