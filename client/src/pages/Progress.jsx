import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, MetricCard, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { FormField, Input } from '../components/Form';
import { Modal } from '../components/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { BarChart } from '../components/Chart';
import { Plus, Flame, Footprints, Activity, Award } from 'lucide-react';

export default function Progress({ setActivePage }) {
  const { progressLogs, workoutPlan, refreshData } = useAuth();
  const { showToast } = useNotifications();

  const [modalOpen, setModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    steps: 6500,
    calories: 380,
    notes: 'Evening recovery walk and core session'
  });

  const [logs, setLogs] = useState(progressLogs);

  useEffect(() => {
    if (progressLogs && progressLogs.length > 0) {
      setLogs(progressLogs);
    }
  }, [progressLogs]);

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    const payload = {
      log_date: new Date().toISOString().split('T')[0],
      calories_burned: parseInt(activityForm.calories || 0),
      steps: parseInt(activityForm.steps || 0),
      workout_completed: true,
      notes: activityForm.notes || 'Activity logged'
    };

    setLogs([payload, ...logs]);
    showToast('Activity metrics recorded to your progress feed.', 'Activity Saved');
    setModalOpen(false);

    try {
      await api.logActivity(payload);
      if (refreshData) refreshData();
    } catch {
      // offline fallback
    }
  };

  const totalCalories = logs.reduce((sum, item) => sum + item.calories_burned, 0);
  const totalSteps = logs.reduce((sum, item) => sum + item.steps, 0);
  const completedCount = logs.filter(item => item.workout_completed).length;

  const chartData = logs.slice(0, 7).reverse().map(l => ({
    label: l.log_date.slice(5),
    value: l.calories_burned,
    completed: l.workout_completed
  }));

  return (
    <div className="page-container" style={{ padding: '40px 32px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
        <div>
          <span className="label-micro">Activity & Performance Telemetry</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
            Progress Analytics & History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Continuous tracking of workout consistency, caloric expenditure, and daily step volume.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} icon={Plus}>
          Log Daily Activity
        </Button>
      </div>

      {/* 2. Key Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '36px' }}>
        <MetricCard
          label="Dedication Score"
          value={`${workoutPlan.commitment_score}%`}
          subtitle={`${completedCount} workouts / ${logs.length} days`}
          icon={Activity}
        />
        <MetricCard
          label="Total Calories Burned"
          value={totalCalories.toLocaleString()}
          unit="kcal"
          subtitle={`Avg ${Math.round(totalCalories / Math.max(1, logs.length))} kcal / day`}
          icon={Flame}
        />
        <MetricCard
          label="Total Steps Recorded"
          value={totalSteps.toLocaleString()}
          subtitle={`Avg ${Math.round(totalSteps / Math.max(1, logs.length)).toLocaleString()} steps / day`}
          icon={Footprints}
        />
        <MetricCard
          label="Current BMI"
          value="22.8"
          subtitle="Normal Weight Range"
          icon={Award}
          onClick={() => setActivePage('bmi')}
        />
      </div>

      {/* 3. Consistency Bar Chart */}
      <Card style={{ marginBottom: '36px' }}>
        <CardHeader
          subtitle="Recent Performance"
          title="Daily Caloric Expenditure"
          badge={<Badge variant="outline">Past 7 Days</Badge>}
        />

        <BarChart
          data={chartData}
          xKey="label"
          yKey="value"
          activeKey="completed"
          height={160}
        />
      </Card>

      {/* 4. Activity Logs Table */}
      <Card>
        <CardHeader
          subtitle="Detailed Feed"
          title="Daily Activity Logs"
          badge={<Badge variant="dark">{logs.length} RECORDS</Badge>}
        />

        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Active Calories</Th>
              <Th>Steps</Th>
              <Th>Session Focus / Notes</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map((log, idx) => (
              <Tr key={idx}>
                <Td style={{ fontWeight: 600 }}>{log.log_date}</Td>
                <Td>
                  {log.workout_completed ? (
                    <Badge variant="dark">COMPLETED</Badge>
                  ) : (
                    <Badge>RECOVERY WALK</Badge>
                  )}
                </Td>
                <Td>
                  <Flame size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {log.calories_burned} kcal
                </Td>
                <Td>
                  <Footprints size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {log.steps.toLocaleString()}
                </Td>
                <Td style={{ color: 'var(--text-secondary)' }}>{log.notes}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Activity Log Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Daily Activity"
        subtitle="Manual Activity Entry"
      >
        <form onSubmit={handleSaveActivity}>
          <FormField label="Steps Taken">
            <Input
              type="number"
              required
              value={activityForm.steps}
              onChange={(e) => setActivityForm({ ...activityForm, steps: e.target.value })}
            />
          </FormField>

          <FormField label="Active Calories Burned (kcal)">
            <Input
              type="number"
              required
              value={activityForm.calories}
              onChange={(e) => setActivityForm({ ...activityForm, calories: e.target.value })}
            />
          </FormField>

          <FormField label="Session Notes">
            <Input
              placeholder="e.g. 5k morning run & core intervals"
              value={activityForm.notes}
              onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Record Activity</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
