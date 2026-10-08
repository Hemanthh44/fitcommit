/**
 * Gym Attendance & QR Check-In Controller
 * Handles QR scanning, membership verification, check-in, check-out, and live occupancy tracking
 * Replaces physical IoT sensors with QR-based gym attendance.
 */

const GymModel = require('../models/gymModel');
const { UserModel } = require('../models/userModel');

const gymController = {
  /**
   * POST /api/gym/check-in
   * Scans gym QR code and initiates attendance session
   */
  async checkIn(req, res) {
    try {
      let identifier = req.body.gymId || req.body.gymIdentifier || req.body.qr_code || req.body.gym_code || req.body.gym;
      const user = req.user;

      if (!identifier) {
        return res.status(400).json({ 
          success: false,
          error: 'Gym identifier is required for check-in.',
          message: 'Gym identifier is required for check-in.' 
        });
      }

      // If the scanned payload was the full URL, extract the gym query param
      if (typeof identifier === 'string' && (identifier.startsWith('http://') || identifier.startsWith('https://') || identifier.includes('gym='))) {
        try {
          const parsedUrl = new URL(identifier, 'http://localhost');
          const extractedParam = parsedUrl.searchParams.get('gym') || parsedUrl.searchParams.get('gymIdentifier');
          if (extractedParam) {
            identifier = extractedParam;
          }
        } catch (e) {
          const match = identifier.match(/[?&]gym=([^&]+)/i);
          if (match) identifier = match[1];
        }
      }

      // 1. Identify and validate the gym using the extracted identifier
      let gym = await GymModel.findByQrCode(identifier.trim());
      if (!gym) {
        // Support canonical demo QR code FITCOMMIT-GYM-001
        if (identifier.trim().toUpperCase() === 'FITCOMMIT-GYM-001') {
          gym = await GymModel.getDefaultGym();
        } else {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid gym QR code.',
            message: 'Invalid gym QR code.' 
          });
        }
      }

      // 2. Verify that the user has an active Premium/Gym membership pass
      const isEligible = user.role === 'PREMIUM_MEMBER' || 
                         user.role === 'TRAINER' || 
                         user.role === 'ADMIN' ||
                         (user.membership && user.membership.gym_access === true);

      if (!isEligible) {
        return res.status(403).json({ 
          success: false,
          error: 'Active gym membership required to check in.',
          message: 'Active gym membership required to check in.',
          details: 'Physical gym facility access is an exclusive feature of the Premium Smart Pass. Upgrade your membership to scan into the gym.',
          requires_upgrade: true
        });
      }

      // 3. Prevent duplicate active check-ins (Rule 1)
      const activeAttendance = await GymModel.getUserActiveAttendance(user.user_id, gym.gym_id);
      if (activeAttendance) {
        return res.status(400).json({ 
          success: false,
          error: 'You are already inside the gym.',
          message: 'You are already inside the gym.',
          already_inside: true,
          active_attendance: activeAttendance,
          checked_in_at: activeAttendance.check_in_time
        });
      }

      // 4. Check gym capacity limit (Rule 3 & 4)
      const currentOccupancy = await GymModel.getCurrentOccupancy(gym.gym_id);
      const capacity = gym.capacity || 100;
      if (currentOccupancy >= capacity) {
        return res.status(400).json({ 
          success: false,
          error: 'Gym is currently full.',
          message: 'The gym is currently full.',
          capacity: capacity,
          currentMembers: currentOccupancy,
          availableSpots: 0,
          occupancyPercentage: 100
        });
      }

      // 5. Create gym active session (Protected by DB unique index)
      let newAttendance;
      try {
        newAttendance = await GymModel.checkIn(user.user_id, gym.gym_id);
      } catch (dbErr) {
        if (dbErr.message?.includes('UNIQUE') || dbErr.code === '23505' || dbErr.message?.includes('uq_gym_active_session')) {
          return res.status(400).json({
            success: false,
            error: 'You are already inside the gym.',
            message: 'You are already inside the gym.',
            already_inside: true
          });
        }
        throw dbErr;
      }

      const newOccupancy = currentOccupancy + 1;
      const availableSpots = Math.max(0, capacity - newOccupancy);
      const occupancyPercentage = Math.round((newOccupancy / capacity) * 100);
      const totalMembers = await GymModel.getTotalGymMembers();

      return res.status(200).json({
        success: true,
        message: 'Checked in successfully.',
        gymId: gym.qr_code || 'FITCOMMIT-GYM-001',
        capacity: capacity,
        currentMembers: newOccupancy,
        availableSpots: availableSpots,
        occupancyPercentage: occupancyPercentage,
        // Compatibility keys
        current_occupancy: newOccupancy,
        available_spots: availableSpots,
        occupancy_percentage: occupancyPercentage,
        attendance: {
          ...newAttendance,
          status: 'CHECKED_IN'
        },
        session: newAttendance,
        gym: {
          gym_id: gym.gym_id,
          gym_name: gym.gym_name,
          capacity: capacity,
          qr_code: gym.qr_code
        },
        occupancy: {
          current_occupancy: newOccupancy,
          capacity: capacity,
          available_spots: availableSpots,
          occupancy_percentage: occupancyPercentage,
          total_members: totalMembers
        }
      });
    } catch (err) {
      console.error('[GymController] Check-in error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error processing gym check-in.', message: 'Internal server error processing gym check-in.' });
    }
  },

  /**
   * POST /api/gym/check-out
   * Finalizes active attendance session
   */
  async checkOut(req, res) {
    try {
      const user = req.user;
      const gym = await GymModel.getDefaultGym();

      // 1. Locate active attendance record (Rule 2)
      const activeAttendance = await GymModel.getUserActiveAttendance(user.user_id, gym.gym_id);
      if (!activeAttendance) {
        return res.status(400).json({ 
          success: false,
          error: 'You are not currently inside the gym.',
          message: 'No active gym session found. You are currently outside the gym.'
        });
      }

      // 2. Mark attendance as completed
      const updatedAttendance = await GymModel.checkOut(activeAttendance.attendance_id);
      const currentOccupancy = await GymModel.getCurrentOccupancy(gym.gym_id);
      const capacity = gym.capacity || 100;
      const availableSpots = Math.max(0, capacity - currentOccupancy);
      const occupancyPercentage = Math.round((currentOccupancy / capacity) * 100);
      const totalMembers = await GymModel.getTotalGymMembers();

      // Compute session duration
      const inTime = new Date(activeAttendance.check_in_time);
      const outTime = new Date(updatedAttendance.check_out_time);
      const durationMinutes = Math.max(1, Math.round((outTime - inTime) / 60000));
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      return res.status(200).json({
        success: true,
        message: 'Checked out successfully.',
        gymId: gym.qr_code || 'FITCOMMIT-GYM-001',
        capacity: capacity,
        currentMembers: currentOccupancy,
        availableSpots: availableSpots,
        occupancyPercentage: occupancyPercentage,
        // Compatibility keys
        current_occupancy: currentOccupancy,
        available_spots: availableSpots,
        occupancy_percentage: occupancyPercentage,
        attendance: {
          ...updatedAttendance,
          status: 'CHECKED_OUT',
          session_duration_formatted: durationFormatted
        },
        session: updatedAttendance,
        duration_minutes: durationMinutes,
        duration_formatted: durationFormatted,
        occupancy: {
          current_occupancy: currentOccupancy,
          capacity: capacity,
          available_spots: availableSpots,
          occupancy_percentage: occupancyPercentage,
          total_members: totalMembers
        }
      });
    } catch (err) {
      console.error('[GymController] Check-out error:', err.message);
      return res.status(500).json({ success: false, error: 'Internal server error processing gym check-out.', message: 'Internal server error processing gym check-out.' });
    }
  },

  /**
   * GET /api/gym/occupancy
   * Public/Member view of gym capacity and user's current status
   */
  async getOccupancy(req, res) {
    try {
      const gym = await GymModel.getDefaultGym();
      const currentOccupancy = await GymModel.getCurrentOccupancy(gym.gym_id);
      const capacity = gym.capacity || 100;
      const availableSpots = Math.max(0, capacity - currentOccupancy);
      const occupancyPercentage = Math.round((currentOccupancy / capacity) * 100);
      const totalMembers = await GymModel.getTotalGymMembers();

      let isInside = false;
      let checkInTime = null;
      let activeAttendance = null;

      if (req.user) {
        const active = await GymModel.getUserActiveAttendance(req.user.user_id, gym.gym_id);
        if (active) {
          isInside = true;
          checkInTime = active.check_in_time;
          activeAttendance = active;
        }
      }

      return res.json({
        gymId: gym.qr_code || 'FITCOMMIT-GYM-001',
        gymName: gym.gym_name,
        capacity: capacity,
        currentMembers: currentOccupancy,
        availableSpots: availableSpots,
        occupancyPercentage: occupancyPercentage,
        userStatus: {
          isInside: isInside,
          checkInTime: checkInTime,
          activeSession: activeAttendance
        },
        // Compatibility keys
        gym_id: gym.gym_id,
        gym_name: gym.gym_name,
        location: gym.location,
        qr_code: gym.qr_code,
        gym_capacity: capacity,
        current_occupancy: currentOccupancy,
        available_spots: availableSpots,
        occupancy_percentage: occupancyPercentage,
        total_registered_members: totalMembers,
        total_members: totalMembers,
        user_status: {
          is_checked_in: isInside,
          active_attendance: activeAttendance
        },
        gym: {
          gym_id: gym.gym_id,
          gym_name: gym.gym_name,
          capacity: capacity,
          qr_code: gym.qr_code
        },
        occupancy: {
          current_occupancy: currentOccupancy,
          capacity: capacity,
          available_spots: availableSpots,
          occupancy_percentage: occupancyPercentage,
          total_members: totalMembers
        }
      });
    } catch (err) {
      console.error('[GymController] Get occupancy error:', err);
      return res.status(500).json({ error: 'Failed to retrieve gym occupancy data.', details: err.message });
    }
  },

  /**
   * POST /api/gym/reset-demo
   * College Demo helper: Resets all active sessions to 0 inside, 100 available
   */
  async resetDemo(req, res) {
    try {
      const gym = await GymModel.getDefaultGym();
      await GymModel.resetDemoOccupancy(gym.gym_id);
      const capacity = gym.capacity || 100;
      return res.status(200).json({
        success: true,
        message: 'Gym occupancy reset for demo.',
        gymId: gym.qr_code || 'FITCOMMIT-GYM-001',
        capacity: capacity,
        currentMembers: 0,
        availableSpots: capacity,
        occupancyPercentage: 0,
        current_occupancy: 0,
        available_spots: capacity,
        occupancy_percentage: 0
      });
    } catch (err) {
      console.error('[GymController] Reset demo error:', err);
      return res.status(500).json({ error: 'Failed to reset gym demo.', details: err.message });
    }
  },

  /**
   * GET /api/gym/my-attendance
   * Member's personal attendance history and metrics
   */
  async getMyAttendance(req, res) {
    try {
      const history = await GymModel.getUserAttendanceHistory(req.user.user_id);
      const statistics = await GymModel.getUserAttendanceStats(req.user.user_id);

      return res.json({
        history,
        attendance: history,
        statistics,
        stats: statistics
      });
    } catch (err) {
      console.error('[GymController] Get my-attendance error:', err);
      return res.status(500).json({ error: 'Failed to retrieve attendance history.', details: err.message });
    }
  },

  /**
   * GET /api/admin/gym/occupancy
   * Admin: Complete Gym Occupancy Dashboard
   */
  async getAdminOccupancy(req, res) {
    try {
      const data = await GymModel.getAdminOccupancyMetrics(1);
      return res.json({
        ...data,
        gym: {
          gym_id: data.gym_id,
          gym_name: data.gym_name,
          qr_code: data.qr_code,
          capacity: data.capacity
        },
        occupancy: {
          current_occupancy: data.current_occupancy,
          capacity: data.capacity,
          occupancy_percentage: data.occupancy_percentage,
          available_spots: data.available_spots,
          total_members: data.total_gym_members,
          check_ins_today: data.today_check_ins,
          check_outs_today: data.today_check_outs
        }
      });
    } catch (err) {
      console.error('[GymController] Admin occupancy error:', err);
      return res.status(500).json({ error: 'Failed to retrieve admin occupancy metrics.', details: err.message });
    }
  },

  /**
   * GET /api/admin/gym/attendance
   * Admin: List all attendance logs
   */
  async getAdminAttendance(req, res) {
    try {
      const logs = await GymModel.getAllAttendance(1, 100);
      return res.json({
        count: logs.length,
        attendance: logs,
        attendance_logs: logs
      });
    } catch (err) {
      console.error('[GymController] Admin attendance list error:', err);
      return res.status(500).json({ error: 'Failed to retrieve admin attendance logs.', details: err.message });
    }
  }

};

module.exports = gymController;
