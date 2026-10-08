import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FormField, Input } from '../components/Form';
import { ArrowRight, UserCheck, Shield, Award, Dumbbell } from 'lucide-react';

export default function Login({ setActivePage }) {
  const { login, demoLogin } = useAuth();
  const { showToast } = useNotifications();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      showToast('Welcome back to FitCommit.', 'Session Active');
      setActivePage('dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    try {
      await demoLogin(role);
      showToast(`Logged in as demo persona (${role.toUpperCase()})`, 'Persona Activated');
      setActivePage('dashboard');
    } catch (err) {
      showToast('Demo login notice: ' + err.message, 'Notice');
      setActivePage('dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '70px 20px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
          <span className="label-micro">Secure Member Access</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginTop: '8px', letterSpacing: '-0.03em' }}>
            Sign In to FitCommit
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '8px' }}>
            Enter your credentials to access your personalized wellness dashboard.
          </p>
        </div>

        {/* Demo Accounts Quick Select */}
        <Card style={{ marginBottom: '24px', padding: '20px' }}>
          <div className="label-micro" style={{ marginBottom: '12px' }}>Instant Demo Login</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handleDemo('base')}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Hemanth S.</div>
              <div style={{ fontSize: '0.68rem', color: '#666666' }}>Base Member</div>
            </Button>

            <Button 
              variant="primary"
              size="sm"
              onClick={() => handleDemo('premium')}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Sumith Raj</div>
              <div style={{ fontSize: '0.68rem', color: '#FDF2F6' }}>Premium Pro</div>
            </Button>

            <Button 
              variant="outline"
              size="sm"
              onClick={() => handleDemo('trainer')}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Arun Abhishek</div>
              <div style={{ fontSize: '0.68rem', color: '#666666' }}>Fitness Trainer</div>
            </Button>

            <Button 
              variant="outline"
              size="sm"
              onClick={() => handleDemo('admin')}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px' }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Bheem Sagar</div>
              <div style={{ fontSize: '0.68rem', color: '#666666' }}>Administrator</div>
            </Button>
          </div>
        </Card>

        {/* Standard Login Form */}
        <Card style={{ borderRadius: '24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              color: '#991B1B',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FormField label="Email Address">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </FormField>

            <FormField label="Password">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              block
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
            </Button>
          </form>

          <div className="hairline" style={{ margin: '24px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Do not have an account?{' '}
            <button
              onClick={() => setActivePage('register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#922756',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
