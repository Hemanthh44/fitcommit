import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { FormField, Input, Select } from '../components/Form';
import { 
  User as UserIcon, 
  Scale, 
  Award, 
  CheckCircle,
  Lock,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function Profile({ setActivePage }) {
  const { user, isPremium, updateUserProfile } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState(user?.name || '');
  const [height, setHeight] = useState(user?.height || 178);
  const [weight, setWeight] = useState(user?.weight || 72.5);
  const [goal, setGoal] = useState(user?.fitness_goal || 'Muscle Gain');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHeight(user.height);
      setWeight(user.weight);
      setGoal(user.fitness_goal);
    }
  }, [user]);

  const handleUpdate = (e) => {
    e.preventDefault();
    setUpdating(true);
    setTimeout(() => {
      updateUserProfile({ name, height, weight, fitness_goal: goal });
      showToast('Profile updated. New BMI index and macronutrient allocations computed.', 'Profile Synchronized');
      setUpdating(false);
    }, 400);
  };

  // Live BMI calculation
  const heightM = height / 100;
  const liveBMI = heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : 0;

  return (
    <div className="container" style={{ padding: '50px 20px', maxWidth: '850px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '40px' }}>
        <span className="label-micro">Member Profile & Biometrics</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
          User Profile & Biometrics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          Manage your dedication settings. Updating your biometrics recalibrates your training plans and macronutrient distribution.
        </p>
      </div>

      {/* Account Info Card */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#922756',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              fontFamily: 'var(--font-display)'
            }}>
              {user?.name?.slice(0, 2).toUpperCase() || 'FC'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#181B26' }}>{user?.name}</h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="dark">
              {user?.role?.replace('_', ' ')}
            </Badge>
            <StatusBadge status="ACTIVE" />
          </div>
        </div>

        {/* Live Biometric Strip */}
        <div style={{
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <div className="label-micro" style={{ fontSize: '0.62rem' }}>Current Stature</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '2px' }}>{height} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>cm</span></div>
          </div>
          <div>
            <div className="label-micro" style={{ fontSize: '0.62rem' }}>Recorded Mass</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '2px' }}>{weight} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kg</span></div>
          </div>
          <div>
            <div className="label-micro" style={{ fontSize: '0.62rem' }}>Computed BMI</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '2px' }}>{liveBMI} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kg/m²</span></div>
          </div>
          <div>
            <div className="label-micro" style={{ fontSize: '0.62rem' }}>Facility Access</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '2px' }}>{isPremium ? 'Granted' : 'Digital Only'}</div>
          </div>
        </div>

        <div className="hairline" style={{ margin: '16px 0 24px 0' }} />

        <form onSubmit={handleUpdate}>
          <div className="grid-2">
            <FormField label="Full Name">
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>

            <FormField label="Dedication Goal">
              <Select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="Muscle Gain">Muscle Gain (Hypertrophy Split)</option>
                <option value="Weight Loss">Weight Loss (Caloric Deficit)</option>
                <option value="Endurance">Endurance & Cardiovascular Conditioning</option>
                <option value="General Fitness">General Fitness Maintenance</option>
              </Select>
            </FormField>
          </div>

          <div className="grid-2">
            <FormField label="Height (cm)">
              <Input
                type="number"
                required
                step="0.5"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              />
            </FormField>

            <FormField label="Weight (kg)">
              <Input
                type="number"
                required
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              type="submit"
              variant="primary"
              disabled={updating}
            >
              {updating ? 'Recalibrating Biometrics...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Regulatory Compliance */}
      <Card style={{ backgroundColor: 'var(--bg-canvas)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Lock size={16} color="#922756" />
          <span className="label-micro" style={{ color: '#922756' }}>Data Privacy & Security</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Health and biometric parameters are encrypted and stored in compliance with the Digital Personal Data Protection (DPDP) Act. Payment transactions adhere strictly to PCI-DSS standards without storing sensitive payment card data locally.
        </p>
      </Card>
    </div>
  );
}
