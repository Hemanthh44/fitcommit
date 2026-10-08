import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, MetricCard, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { CommitmentMeter, MacroBar } from '../components/ProgressIndicator';
import { BarChart } from '../components/Chart';
import { 
  Play, 
  CheckCircle, 
  ArrowRight, 
  Activity, 
  Flame, 
  Footprints, 
  Scale, 
  Cpu, 
  Sliders, 
  QrCode,
  Sparkles 
} from 'lucide-react';

export default function Dashboard({ setActivePage }) {
  const { user, isPremium, workoutPlan, dietPlan, equipmentList, completeTodayWorkout } = useAuth();
  const { showToast } = useNotifications();

  const [liveOccupancy, setLiveOccupancy] = useState({
    currentMembers: 0,
    capacity: 100,
    availableSpots: 100,
    occupancyPercentage: 0
  });

  useEffect(() => {
    const fetchOcc = async () => {
      try {
        const res = await api.getGymOccupancy();
        if (res) {
          setLiveOccupancy({
            currentMembers: res.currentMembers ?? res.current_occupancy ?? 0,
            capacity: res.capacity || 100,
            availableSpots: res.availableSpots ?? res.available_spots ?? 100,
            occupancyPercentage: res.occupancyPercentage ?? res.occupancy_percentage ?? 0
          });
        }
      } catch (e) {}
    };

    fetchOcc();
    const interval = setInterval(fetchOcc, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkComplete = () => {
    completeTodayWorkout(520);
    showToast('Today’s workout recorded. Weekly commitment score updated!', 'Workout Completed');
  };

  const todaySession = workoutPlan?.schedule?.[0] || {
    name: 'Upper Body Hypertrophy',
    durationMinutes: 45,
    exercises: [
      { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10' },
      { name: 'Chest-Supported Row', sets: 4, reps: '10-12' },
      { name: 'Overhead Dumbbell Press', sets: 3, reps: '10-12' },
      { name: 'Bicep & Tricep Finisher', sets: 3, reps: '12-15' }
    ]
  };

  const chartData = [
    { label: 'Mon', value: 480, completed: true },
    { label: 'Tue', value: 520, completed: true },
    { label: 'Wed', value: 210, completed: false },
    { label: 'Thu', value: 460, completed: true },
    { label: 'Fri', value: 490, completed: true },
    { label: 'Sat', value: 240, completed: false },
    { label: 'Sun', value: 510, completed: workoutPlan.is_completed_today }
  ];

  return (
    <div className="page-container" style={{ padding: '36px 32px', backgroundColor: 'var(--bg-canvas)' }}>
      {/* 1. Greeting & Eyebrow Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '24px',
        marginBottom: '36px'
      }}>
        <div>
          <div className="pill-eyebrow" style={{ marginBottom: '10px' }}>
            <span className="dot"></span>
            <span>{isPremium ? 'Premium Smart Pass Active' : 'Base Commitment Tier'}</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#181B26', margin: 0 }}>
            Good morning, {user?.name?.split(' ')[0] || 'Hemanth'}.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', marginTop: '6px' }}>
            Fitness Goal: <strong>{user?.fitness_goal}</strong> • Dynamic volume calibration active.
          </p>
        </div>

        {/* Commitment Widget Card */}
        <Card style={{ minWidth: '320px', padding: '20px 24px', borderRadius: '20px' }}>
          <CommitmentMeter score={workoutPlan.commitment_score} target={75} />
        </Card>
      </div>

      {/* 2. KPI Cards Ribbon */}
      <div className="grid-4" style={{ marginBottom: '36px' }}>
        <MetricCard
          label="Body Mass Index"
          value="22.8"
          subtitle="Normal Weight • Tap to inspect"
          icon={Scale}
          onClick={() => setActivePage('bmi')}
        />
        <MetricCard
          label="Target Calories"
          value={dietPlan.calorie_target}
          unit="kcal"
          subtitle={`${Math.max(0, dietPlan.calorie_target - dietPlan.consumed_today.calories)} kcal remaining`}
          icon={Flame}
          onClick={() => setActivePage('nutrition')}
        />
        <MetricCard
          label="Workouts Done"
          value={`${workoutPlan.completed_this_week} / ${workoutPlan.target_this_week}`}
          subtitle={workoutPlan.is_completed_today ? 'Completed today' : 'Scheduled for today'}
          icon={Activity}
          onClick={() => setActivePage('workout')}
        />
        <MetricCard
          label="Daily Steps"
          value="8,421"
          subtitle="Target: 8,000 steps reached"
          icon={Footprints}
          onClick={() => setActivePage('progress')}
        />
      </div>

      {/* 3. Operational Grid (Today's Workout + Daily Nutrition) */}
      <div className="grid-2" style={{ marginBottom: '36px' }}>
        {/* Today's Workout Card */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '20px' }}>
          <div>
            <CardHeader
              subtitle="Today's Adaptive Session"
              title={todaySession.name}
              badge={<Badge>{todaySession.durationMinutes || 45} MIN</Badge>}
            />

            {/* AI Adaptation Notice */}
            <div style={{
              backgroundColor: '#FDF2F6',
              border: '1px solid #F5D3E0',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '0.84rem',
              color: '#922756',
              marginBottom: '20px',
              lineHeight: 1.5
            }}>
              <strong>Adaptive Volume Calibration:</strong> {workoutPlan.adaptation_notes}
            </div>

            {/* Exercise List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {todaySession.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#FAFBFC',
                    borderRadius: '10px',
                    fontSize: '0.88rem'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#181B26' }}>{ex.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{ex.sets} sets × {ex.reps}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            {workoutPlan.is_completed_today ? (
              <div style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                borderRadius: '9999px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <CheckCircle size={16} /> Completed Today
              </div>
            ) : (
              <Button onClick={handleMarkComplete} style={{ flex: 1 }}>
                <CheckCircle size={16} /> Mark Completed Today
              </Button>
            )}

            <Button variant="secondary" onClick={() => setActivePage('workout')}>
              Routine Details <ArrowRight size={14} />
            </Button>
          </div>
        </Card>

        {/* Nutrition Target Card */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '20px' }}>
          <div>
            <CardHeader
              subtitle="Macronutrient Budget • Daily Recommended"
              title="Daily Nutrition Target"
              badge={<Badge>Mifflin-St Jeor</Badge>}
            />

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Scientifically partitioned based on your BMI of 22.8 and {user?.fitness_goal} dedication target.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              <MacroBar
                label="Protein (Lean Mass Synthesis)"
                current={dietPlan.consumed_today.protein}
                target={dietPlan.macros.protein}
                subtext={`${Math.max(0, dietPlan.macros.protein - dietPlan.consumed_today.protein)}g remaining`}
              />
              <MacroBar
                label="Carbohydrates (Glycogen Stores)"
                current={dietPlan.consumed_today.carbs}
                target={dietPlan.macros.carbs}
                subtext={`${Math.max(0, dietPlan.macros.carbs - dietPlan.consumed_today.carbs)}g remaining`}
              />
              <MacroBar
                label="Healthy Fats (Hormonal Balance)"
                current={dietPlan.consumed_today.fat}
                target={dietPlan.macros.fat}
                subtext={`${Math.max(0, dietPlan.macros.fat - dietPlan.consumed_today.fat)}g remaining`}
              />
            </div>
          </div>

          <Button variant="secondary" block onClick={() => setActivePage('nutrition')}>
            Explore Meal Plan <ArrowRight size={14} />
          </Button>
        </Card>
      </div>

      {/* AI Meal Analyzer Callout Banner */}
      <div style={{
        backgroundColor: '#FAFBFC',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '24px 28px',
        marginBottom: '36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FDF2F6',
            color: '#922756',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div className="label-micro" style={{ color: '#922756', marginBottom: '2px' }}>
              AI-POWERED NUTRITION VISION
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#181B26', margin: '0 0 2px 0' }}>
              Know what's on your plate.
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#505A69', margin: 0 }}>
              Upload a meal photo for automatic food identification, portions, and macro breakdown.
            </p>
          </div>
        </div>

        <Button onClick={() => setActivePage('nutrition')} icon={ArrowRight}>
          AI Meal Analyzer
        </Button>
      </div>

      {/* 4. Weekly Consistency Chart */}
      <Card style={{ marginBottom: '36px', borderRadius: '20px' }}>
        <CardHeader
          subtitle="7-Day Performance Stream"
          title="Workout Consistency & Caloric Burn"
          badge={<Badge variant="outline">Performance</Badge>}
        />

        <BarChart
          data={chartData}
          xKey="label"
          yKey="value"
          activeKey="completed"
          height={160}
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#922756', borderRadius: '2px', display: 'inline-block' }} />
            <span>Completed Workout (Caloric Burn)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: '#E2E8F0', borderRadius: '2px', display: 'inline-block' }} />
            <span>Active Rest / Mobility Day</span>
          </div>
        </div>
      </Card>

      {/* 5. Real-Time Gym Floor Occupancy & QR Attendance Banner */}
      <section style={{ 
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '36px',
        boxShadow: '0 4px 20px rgba(24, 27, 38, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                ● Real-Time Telemetry Active
              </span>
              <span className="label-micro" style={{ color: '#8E95A5' }}>
                FITCOMMIT CENTRAL GYM
              </span>
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, marginTop: '8px', color: '#181B26' }}>
              Facility Occupancy: {liveOccupancy.currentMembers} / {liveOccupancy.capacity} Inside ({liveOccupancy.occupancyPercentage}%)
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.90rem', marginTop: '4px', margin: 0 }}>
              Physical entrance tracking via QR scan. <strong style={{ color: '#922756' }}>{liveOccupancy.availableSpots} spaces</strong> currently open for training.
            </p>
          </div>
          <Button 
            variant="primary" 
            size="md" 
            onClick={() => setActivePage('attendance')}
            style={{ padding: '12px 28px' }}
          >
            <QrCode size={16} /> Open QR Check-In <ArrowRight size={15} />
          </Button>
        </div>
      </section>

      {/* 6. Smart Gym Floor Snapshot */}
      <Card style={{ borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="label-micro" style={{ color: '#922756' }}>Smart Gym Telemetry • Real-Time Sensors</span>
            <h3 className="headline-card" style={{ marginTop: '4px' }}>Live Gym Equipment Occupancy</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setActivePage('equipment')}>
            View Full Floor Plan <ArrowRight size={14} />
          </Button>
        </div>

        <div className="grid-3">
          {equipmentList.slice(0, 3).map((eq) => (
            <Card key={eq.equipment_id} padding="tight" style={{ backgroundColor: '#FAFBFC', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#181B26' }}>{eq.equipment_name}</span>
                <StatusBadge status={eq.occupancy_status} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {eq.occupancy_status === 'OCCUPIED' ? (
                  <><strong>Alternative:</strong> {eq.alternatives[0]?.suggested_exercise_name || 'Free weight variation'}</>
                ) : (
                  <>Station available in Flagship facility</>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
