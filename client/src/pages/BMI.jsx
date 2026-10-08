import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { FormField, Input } from '../components/Form';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { TrendLineChart } from '../components/Chart';
import { Scale, TrendingUp, ArrowRight, Check } from 'lucide-react';

export default function BMI({ setActivePage }) {
  const { user, bmiHistory, updateUserProfile } = useAuth();
  const { showToast } = useNotifications();

  const [height, setHeight] = useState(user?.height || 178);
  const [weight, setWeight] = useState(user?.weight || 72.5);
  const [saving, setSaving] = useState(false);

  const latestRecord = bmiHistory[bmiHistory.length - 1] || {
    height: 178,
    weight: 72.5,
    bmi_value: 22.88,
    category: 'Normal Weight'
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      updateUserProfile({ height, weight });
      showToast('BMI recorded & saved. Macronutrient targets recalibrated.', 'Biometrics Synchronized');
      setSaving(false);
    }, 300);
  };

  const trendData = bmiHistory.map(b => ({
    label: b.record_date,
    value: b.bmi_value
  }));

  return (
    <div className="page-container" style={{ padding: '40px 32px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '36px' }}>
        <span className="label-micro">Body Composition Analytics</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
          Body Mass Index (BMI) Tracking
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          Continuous tracking of body composition. Updating weight automatically recalibrates macronutrient targets.
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: '40px' }}>
        {/* Current BMI Card */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="label-micro">Current Index</span>
                <div className="metric-value" style={{ fontSize: '3.2rem', marginTop: '6px' }}>
                  {latestRecord.bmi_value}
                </div>
              </div>
              <Badge variant="dark">{latestRecord.category}</Badge>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Height: <strong>{latestRecord.height} cm</strong> • Weight: <strong>{latestRecord.weight} kg</strong>
            </p>

            {/* WHO Scale Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div className="label-micro" style={{ marginBottom: '8px' }}>WHO Standard Classification</div>
              <div style={{ display: 'flex', height: '10px', width: '100%', gap: '2px', backgroundColor: '#E4E4E0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ flex: '18.5', backgroundColor: '#E2E8F0' }} title="Underweight (< 18.5)" />
                <div style={{ flex: '6.4', backgroundColor: '#922756' }} title="Normal Weight (18.5 - 24.9)" />
                <div style={{ flex: '5.0', backgroundColor: '#F59E0B' }} title="Overweight (25 - 29.9)" />
                <div style={{ flex: '10.0', backgroundColor: '#EF4444' }} title="Obese (≥ 30)" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>&lt;18.5 Underweight</span>
                <span>18.5–24.9 Normal</span>
                <span>25–29.9 Overweight</span>
                <span>≥30 Obese</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            padding: '14px',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>Automatic Feedback:</strong> Submitting a new weight automatically recalibrates your protein, carbohydrate, and fat targets tailored to your metabolic rate.
          </div>
        </Card>

        {/* Input Form Card */}
        <Card>
          <CardHeader
            subtitle="Submit Metrics"
            title="Log New Height & Weight"
          />

          <form onSubmit={handleCalculate}>
            <FormField label="Height (in centimeters)">
              <Input
                type="number"
                required
                min="100"
                max="250"
                step="0.5"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </FormField>

            <FormField label="Current Weight (in kilograms)">
              <Input
                type="number"
                required
                min="35"
                max="250"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </FormField>

            <Button
              type="submit"
              block
              loading={saving}
              style={{ marginTop: '16px' }}
            >
              Recalculate & Save BMI
            </Button>
          </form>
        </Card>
      </div>

      {/* Historical Trend Table & Chart */}
      <Card style={{ marginBottom: '36px' }}>
        <CardHeader
          subtitle="Timeline Analysis"
          title="BMI Historical Progression"
          badge={<Badge variant="outline"><TrendingUp size={12} /> {bmiHistory.length} READINGS</Badge>}
        />

        <div style={{ marginBottom: '28px' }}>
          <TrendLineChart data={trendData} height={120} />
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Date Recorded</Th>
              <Th>Height (cm)</Th>
              <Th>Weight (kg)</Th>
              <Th>Calculated BMI</Th>
              <Th>WHO Category</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bmiHistory.map((rec, idx) => (
              <Tr key={idx}>
                <Td>{rec.record_date}</Td>
                <Td>{rec.height} cm</Td>
                <Td>{rec.weight} kg</Td>
                <Td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{rec.bmi_value}</Td>
                <Td><Badge variant={rec.category === 'Normal Weight' ? 'dark' : 'outline'}>{rec.category}</Badge></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
