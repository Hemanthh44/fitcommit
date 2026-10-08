import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, MetricCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Lock,
  RefreshCw
} from 'lucide-react';

export default function GymCheckInPage({ setActivePage }) {
  const { user, isPremium, demoLogin } = useAuth();
  const { showToast } = useNotifications();

  // Extract gym parameter from URL
  const [gymId, setGymId] = useState('FITCOMMIT-GYM-001');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [occupancyInfo, setOccupancyInfo] = useState({
    gym_name: 'FitCommit Central Gym',
    capacity: 100,
    current_occupancy: 24,
    available_spots: 76,
    occupancy_percentage: 24,
    total_members: 150,
    user_status: {
      is_checked_in: false,
      active_attendance: null
    }
  });

  // Extract URL params on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const gymParam = urlParams.get('gym') || urlParams.get('gymIdentifier');
      if (gymParam) {
        setGymId(gymParam.trim());
      } else {
        const stored = sessionStorage.getItem('pending_gym_checkin');
        if (stored) setGymId(stored);
      }
    } catch (e) {
      console.warn('URL parsing notice:', e);
    }
  }, []);

  // Fetch live facility occupancy and user status
  const fetchStatus = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.getGymOccupancy();
      if (res) {
        const capacity = res.capacity || res.gym_capacity || 100;
        const current = res.currentMembers ?? res.current_occupancy ?? res.occupancy?.current_occupancy ?? 0;
        const available = res.availableSpots ?? res.available_spots ?? Math.max(0, capacity - current);
        const percent = res.occupancyPercentage ?? res.occupancy_percentage ?? Math.round((current / capacity) * 100);

        setOccupancyInfo({
          gym_name: res.gymName || res.gym_name || res.gym?.gym_name || 'FitCommit Central Gym',
          capacity: capacity,
          current_occupancy: current,
          available_spots: available,
          occupancy_percentage: percent,
          total_members: res.total_members ?? res.occupancy?.total_members ?? 150,
          user_status: res.user_status || { 
            is_checked_in: Boolean(res.userStatus?.isInside), 
            active_attendance: res.userStatus?.activeSession || null 
          }
        });
      }
    } catch (err) {
      console.warn('Occupancy retrieval:', err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus(false);
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle Check-In Action
  const handleCheckIn = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.gymCheckIn({ gymIdentifier: gymId });
      setSuccessMsg(`Checked into ${res.gym?.gym_name || occupancyInfo.gym_name} successfully!`);
      showToast('Welcome to FitCommit! Attendance logged.', 'QR Check-In Verified');
      sessionStorage.removeItem('pending_gym_checkin');
      await fetchStatus();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Check-in failed.';
      setErrorMsg(msg);
      showToast(msg, 'Check-In Notice');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Check-Out Action
  const handleCheckOut = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.gymCheckOut();
      setSuccessMsg(`Checked out successfully. Session duration: ${res.duration_formatted || res.attendance?.session_duration_formatted || 'recorded'}.`);
      showToast('Checked out. Have a great recovery!', 'Gym Session Completed');
      await fetchStatus();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Check-out failed.';
      setErrorMsg(msg);
      showToast(msg, 'Check-Out Notice');
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect to login preserving gym ID
  const handleGoToLogin = () => {
    sessionStorage.setItem('pending_gym_checkin', gymId);
    setActivePage('login');
  };

  const isCheckedIn = occupancyInfo.user_status?.is_checked_in;
  const activeSession = occupancyInfo.user_status?.active_attendance;

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '640px' }}>
      
      {/* 1. Header Card */}
      <Card style={{ 
        border: '2px solid #922756', 
        padding: '36px 32px',
        textAlign: 'center',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(146, 39, 86, 0.08)'
      }}>
        
        {/* Plaque Header Pill */}
        <div style={{ marginBottom: '16px' }}>
          <img 
            src="/images/fitcommit-emblem.png" 
            alt="FitCommit Crest" 
            style={{ 
              height: '48px', 
              width: 'auto', 
              margin: '0 auto 10px auto', 
              display: 'block' 
            }} 
          />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#FDF2F6', border: '1px solid #F5D3E0', padding: '6px 16px', borderRadius: '9999px' }}>
            <Building2 size={14} color="#922756" />
            <span className="label-micro" style={{ color: '#922756', letterSpacing: '0.08em' }}>
              FITCOMMIT ENTRANCE ACCESS PORTAL
            </span>
          </div>
        </div>

        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '2.1rem', 
          fontWeight: 800, 
          letterSpacing: '-0.03em', 
          margin: '0 0 6px 0',
          color: '#181B26'
        }}>
          {occupancyInfo.gym_name}
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
          <MapPin size={15} />
          <span>Main Facility</span>
          <span>•</span>
          <code style={{ fontWeight: 700, color: '#922756' }}>{gymId}</code>
        </div>

        {/* Live Facility Telemetry Pill */}
        <div style={{
          backgroundColor: '#FAFBFC',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-around',
          textAlign: 'center'
        }}>
          <div>
            <div className="label-micro" style={{ fontSize: '10px' }}>Current Occupancy</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#181B26', marginTop: '2px' }}>
              {occupancyInfo.current_occupancy} / {occupancyInfo.capacity}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              ({occupancyInfo.occupancy_percentage}% Full)
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)' }} />
          <div>
            <div className="label-micro" style={{ fontSize: '10px' }}>Available Spots</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {occupancyInfo.available_spots} spots
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ready for entry
            </div>
          </div>
        </div>

        {/* 2. Messages */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: '12px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem', color: '#991B1B' }}>
              {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            padding: '12px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem', color: '#166534', fontWeight: 600 }}>
              {successMsg}
            </div>
          </div>
        )}

        {/* 3. Action Section depending on Auth and Check-In state */}
        {user ? (
          <div>
            {isCheckedIn ? (
              <div>
                <div style={{
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  padding: '20px',
                  borderRadius: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                    <CheckCircle2 size={18} /> You are currently inside the gym
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#CCCCCC' }}>
                    Logged in as <strong>{user.name}</strong> • Active session in progress
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Button 
                    variant="primary" 
                    block 
                    disabled={submitting} 
                    onClick={handleCheckOut}
                    style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                  >
                    <LogOut size={16} /> Check Out Now
                  </Button>
                  <Button 
                    variant="outline" 
                    block 
                    onClick={() => setActivePage('attendance')}
                  >
                    View Attendance History & Analytics <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>
                  Ready to check in?
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 24px 0' }}>
                  Authenticated as <strong>{user.name}</strong> ({user.role})
                </p>

                <Button 
                  variant="primary" 
                  size="lg" 
                  block 
                  disabled={submitting} 
                  onClick={handleCheckIn}
                  style={{ padding: '14px 20px', fontSize: '1rem' }}
                >
                  <LogIn size={18} /> Confirm Gym Check-In
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Unauthenticated state */
          <div>
            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#92400E', fontSize: '0.9rem' }}>
                <Lock size={16} /> Authentication Required
              </div>
              <p style={{ color: '#B45309', fontSize: '0.82rem', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Please sign in to verify your active gym membership. Your gym destination (<code>{gymId}</code>) will be preserved after signing in.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button variant="primary" block size="lg" onClick={handleGoToLogin}>
                <LogIn size={16} /> Sign In to Check In
              </Button>
              
              {/* Instant Member Sign-In */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                <div className="label-micro" style={{ marginBottom: '8px', color: '#64748B' }}>Quick Access</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="xs" variant="outline" block onClick={() => demoLogin('premium')}>
                    Sign In as Member
                  </Button>
                  <Button size="xs" variant="outline" block onClick={handleGoToLogin}>
                    Manual Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </Card>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Button variant="outline" size="sm" onClick={() => setActivePage('dashboard')}>
          ← Return to Dashboard
        </Button>
      </div>

    </div>
  );
}
