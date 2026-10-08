import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { FormField, Input, Select } from '../components/Form';
import { ArrowRight, Check } from 'lucide-react';

export default function Register({ setActivePage }) {
  const { register } = useAuth();
  const { showToast } = useNotifications();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    height: 175,
    weight: 70,
    fitness_goal: 'Muscle Gain',
    role: 'BASE_MEMBER'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live BMI estimate
  const heightM = formData.height / 100;
  const estimatedBMI = heightM > 0 ? (formData.weight / (heightM * heightM)).toFixed(1) : 0;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      showToast('Account initialized. Adaptive routines created in database.', 'Welcome to FitCommit');
      setActivePage('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img 
            src={isDark ? '/images/fitcommit-logo-dark.png' : '/images/fitcommit-logo.png'} 
            alt="FitCommit" 
            style={{ 
              height: '46px', 
              width: 'auto', 
              maxWidth: '220px', 
              margin: '0 auto 16px auto', 
              display: 'block',
              cursor: 'pointer'
            }} 
            onClick={() => setActivePage('landing')}
          />
          <span className="label-micro">Member Onboarding</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginTop: '8px', letterSpacing: '-0.03em' }}>
            Initialize Your FitCommit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '8px' }}>
            Set your biometrics and dedication goals for automated AI plan generation.
          </p>
        </div>

        <Card>
          {error && (
            <div style={{
              backgroundColor: '#F8F8F6',
              border: '1px solid #111111',
              padding: '12px',
              fontSize: '0.82rem',
              color: '#111111',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <FormField label="Full Name">
                <Input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Henrik Vestergaard"
                  value={formData.name}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Email Address">
                <Input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <FormField label="Account Password">
              <Input
                type="password"
                name="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </FormField>

            <div className="grid-2">
              <FormField label="Height (cm)">
                <Input
                  type="number"
                  name="height"
                  required
                  min="100"
                  max="250"
                  step="0.5"
                  value={formData.height}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Weight (kg)">
                <Input
                  type="number"
                  name="weight"
                  required
                  min="30"
                  max="300"
                  step="0.5"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            {/* Live Biometric Indicator */}
            <div style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-color)',
              padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span className="label-micro">Estimated Baseline BMI</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {estimatedBMI} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>kg/m²</span>
                </div>
              </div>
              <Badge variant="outline" style={{ fontSize: '0.75rem' }}>
                {estimatedBMI < 18.5 ? 'Underweight' : estimatedBMI < 25 ? 'Normal Weight' : estimatedBMI < 30 ? 'Overweight' : 'Obese'}
              </Badge>
            </div>

            <FormField label="Primary Fitness Goal">
              <Select
                name="fitness_goal"
                value={formData.fitness_goal}
                onChange={handleChange}
              >
                <option value="Muscle Gain">Muscle Gain (Hypertrophy & Strength)</option>
                <option value="Weight Loss">Weight Loss (Caloric Deficit & Tone)</option>
                <option value="Endurance">Endurance & Cardiovascular Capacity</option>
                <option value="General Fitness">General Fitness & Postural Longevity</option>
              </Select>
            </FormField>

            {/* Membership Tier Choice */}
            <div className="form-group">
              <label className="form-label">Select Initial Membership Tier</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div 
                  onClick={() => setFormData({ ...formData, role: 'BASE_MEMBER' })}
                  style={{
                    border: formData.role === 'BASE_MEMBER' ? '2px solid #922756' : '1px solid var(--border-color)',
                    padding: '16px',
                    cursor: 'pointer',
                    borderRadius: '14px',
                    backgroundColor: formData.role === 'BASE_MEMBER' ? '#FDF2F6' : '#FFFFFF',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#181B26' }}>Base Tier</div>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Free • Home & AI Plans</div>
                </div>

                <div 
                  onClick={() => setFormData({ ...formData, role: 'PREMIUM_MEMBER' })}
                  style={{
                    border: formData.role === 'PREMIUM_MEMBER' ? '2px solid #922756' : '1px solid var(--border-color)',
                    padding: '16px',
                    cursor: 'pointer',
                    borderRadius: '14px',
                    backgroundColor: formData.role === 'PREMIUM_MEMBER' ? '#FDF2F6' : '#FFFFFF',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#922756' }}>Premium Pass</div>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>$29/mo • Smart Gym & Coach</div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              block
              disabled={loading}
              style={{ marginTop: '20px', padding: '14px' }}
            >
              {loading ? 'Creating Your Account...' : 'Complete Registration'} <ArrowRight size={16} />
            </Button>
          </form>

          <div className="hairline" style={{ margin: '24px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Already registered?{' '}
            <button
              onClick={() => setActivePage('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#922756',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sign In Instead
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
