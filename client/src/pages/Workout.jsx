import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { 
  CheckCircle, 
  Clock, 
  Layers, 
  Sliders, 
  Flame, 
  ArrowRight,
  TrendingUp,
  History,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function Workout({ setActivePage }) {
  const { workoutPlan, progressLogs, completeTodayWorkout } = useAuth();
  const { showToast } = useNotifications();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [logging, setLogging] = useState(false);
  const [aiCustomPlan, setAiCustomPlan] = useState(null);
  const [calibrating, setCalibrating] = useState(false);

  const currentPlan = aiCustomPlan || workoutPlan;
  const schedule = currentPlan?.schedule || [];
  const activeSession = schedule[selectedDayIdx] || schedule[0];

  const handleRecalibrateAi = async () => {
    setCalibrating(true);
    try {
      const res = await api.getWorkoutRecommendation();
      if (res) {
        setAiCustomPlan(res);
        showToast(
          `AI Engine recalibrated volume scaling to ${res.adaptive_volume_scale}x based on commitment.`,
          'AI Adaptation Active'
        );
      }
    } catch (err) {
      console.warn('AI Workout error:', err.message);
    } finally {
      setCalibrating(false);
    }
  };

  const handleCompleteSession = () => {
    setLogging(true);
    setTimeout(() => {
      completeTodayWorkout(490);
      showToast(`Completed ${activeSession?.name}! Consistency score increased.`, 'Session Logged');
      setLogging(false);
    }, 400);
  };

  const completedHistory = progressLogs.filter(p => p.workout_completed);

  return (
    <div className="page-container" style={{ padding: '40px 32px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
        <div>
          <span className="label-micro">Adaptive Workout Plan</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
            {currentPlan?.plan_name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Calibrated for: <strong>{currentPlan?.target_goal}</strong> • Difficulty: <strong>{currentPlan?.difficulty_level}</strong>
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRecalibrateAi}
          disabled={calibrating}
        >
          <Sparkles size={14} className={calibrating ? 'spin' : ''} /> {calibrating ? 'Calibrating...' : 'AI Recalibrate Plan'}
        </Button>
      </div>

      {/* 2. Commitment Adaptive Rule Banner Card */}
      <Card style={{
        borderLeft: '4px solid #922756',
        marginBottom: '36px',
        padding: '24px 30px',
        borderRadius: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#922756" />
              <span className="label-micro" style={{ color: '#922756' }}>AI Commitment Adaptation Engine</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '6px' }}>
              Adjustment Factor: {workoutPlan?.adjustment_factor}× Volume Scaling
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', maxWidth: '720px' }}>
              {workoutPlan?.adaptation_notes}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="label-micro">Weekly Adherence</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700 }}>
              {workoutPlan?.commitment_score}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Based on 14-day history</div>
          </div>
        </div>
      </Card>

      {/* 3. Daily Workout Selector */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '28px' }}>
        {schedule.map((session, idx) => (
          <Button
            key={idx}
            variant={selectedDayIdx === idx ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedDayIdx(idx)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {session.day}: {session.name}
          </Button>
        ))}
      </div>

      {/* 4. Active Workout Routine Breakdown */}
      {activeSession && (
        <Card style={{ marginBottom: '40px' }}>
          <CardHeader
            subtitle={activeSession.day}
            title={activeSession.name}
            badge={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge><Clock size={12} /> {activeSession.durationMinutes} MIN</Badge>
                <Badge><Layers size={12} /> {activeSession.exercises.length} EXERCISES</Badge>
              </div>
            }
          />

          {/* Exercise Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {activeSession.exercises.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-canvas)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ex.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Target Intensity: RPE {ex.targetRPE} (Effort Scale 1-10)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                    {ex.sets} sets
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {ex.reps} reps
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
            <Button
              onClick={handleCompleteSession}
              loading={logging}
              icon={CheckCircle}
              style={{ padding: '14px 28px' }}
            >
              Mark Session as Completed
            </Button>
          </div>
        </Card>
      )}

      {/* 5. Workout History Table */}
      <Card>
        <CardHeader
          subtitle="Performance History"
          title="Workout Completion History"
          badge={<Badge variant="outline"><History size={12} /> {completedHistory.length} SESSIONS</Badge>}
        />

        <Table>
          <Thead>
            <Tr>
              <Th>Date Recorded</Th>
              <Th>Routine</Th>
              <Th>Calories Burned</Th>
              <Th>Daily Steps</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {completedHistory.map((item, idx) => (
              <Tr key={idx}>
                <Td style={{ fontWeight: 600 }}>{item.log_date}</Td>
                <Td>{item.notes}</Td>
                <Td>
                  <Flame size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {item.calories_burned} kcal
                </Td>
                <Td>{item.steps.toLocaleString()}</Td>
                <Td><Badge variant="dark">COMPLETED</Badge></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
