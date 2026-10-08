import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { RealCameraQrScanner } from '../components/RealCameraQrScanner';
import { GymQrCodePlacard } from '../components/GymQrCodePlacard';
import { 
  QrCode, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  RefreshCw,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function GymAttendance({ setActivePage }) {
  const { user, isPremium, demoLogin } = useAuth();
  const { showToast } = useNotifications();

  // Core Occupancy State (matching Section 10 API spec)
  const [occupancy, setOccupancy] = useState({
    gymId: 'FITCOMMIT-GYM-001',
    gymName: 'FitCommit Central Gym',
    capacity: 100,
    currentMembers: 0,
    availableSpots: 100,
    occupancyPercentage: 0,
    userStatus: {
      isInside: false,
      checkInTime: null
    }
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [modalTab, setModalTab] = useState('camera'); // 'camera' or 'plaque'
  const [scannerError, setScannerError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Fetch Live Occupancy
  const fetchOccupancy = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.getGymOccupancy();
      if (res) {
        const capacity = res.capacity || res.gym_capacity || 100;
        const current = res.currentMembers ?? res.current_occupancy ?? res.occupancy?.current_occupancy ?? 0;
        const available = res.availableSpots ?? res.available_spots ?? Math.max(0, capacity - current);
        const percent = res.occupancyPercentage ?? res.occupancy_percentage ?? Math.round((current / capacity) * 100);
        
        const isInside = Boolean(res.userStatus?.isInside ?? res.user_status?.is_checked_in);
        const inTime = res.userStatus?.checkInTime || res.user_status?.active_attendance?.check_in_time || null;

        setOccupancy({
          gymId: res.gymId || res.qr_code || 'FITCOMMIT-GYM-001',
          gymName: res.gymName || res.gym_name || 'FitCommit Central Gym',
          capacity: capacity,
          currentMembers: current,
          availableSpots: available,
          occupancyPercentage: percent,
          userStatus: {
            isInside: isInside,
            checkInTime: inTime
          }
        });
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn('[Gym Availability] Polling notice:', err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Real-time automatic polling every 4 seconds
  useEffect(() => {
    fetchOccupancy(false);

    const pollingInterval = setInterval(() => {
      fetchOccupancy(true);
    }, 4000);

    return () => clearInterval(pollingInterval);
  }, [user]);

  // Handle QR Check-In
  const handleCheckIn = async (scannedPayload) => {
    setActionLoading(true);
    setScannerError(null);
    try {
      let identifier = scannedPayload;
      if (typeof scannedPayload === 'string') {
        const text = scannedPayload.trim();
        // Check for JSON payload
        if (text.startsWith('{') && text.endsWith('}')) {
          try {
            const parsed = JSON.parse(text);
            identifier = parsed.gymId || parsed.gymIdentifier || parsed.gym || text;
          } catch (e) {}
        } else if (text.startsWith('http://') || text.startsWith('https://') || text.includes('gym=')) {
          try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://fitcommit.internal';
            const parsed = new URL(text, baseUrl);
            identifier = parsed.searchParams.get('gym') || parsed.searchParams.get('gymIdentifier') || text;
          } catch (e) {
            const match = text.match(/[?&]gym=([^&]+)/i);
            if (match) identifier = match[1];
          }
        }
        identifier = decodeURIComponent(identifier).trim();
      }

      const res = await api.gymCheckIn({ gymId: identifier, gymIdentifier: identifier });
      
      showToast(
        res.message || 'Checked in successfully. Welcome to FitCommit!',
        'QR Check-In Verified'
      );
      
      setShowScannerModal(false);
      await fetchOccupancy(false);
    } catch (err) {
      const errMsg = err.data?.message || err.data?.error || err.message || 'Check-in failed';
      setScannerError(errMsg);
      showToast(errMsg, 'Check-In Notice');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.gymCheckOut();
      showToast(
        res.message || 'Checked out successfully. Have a great recovery!',
        'Gym Session Ended'
      );
      await fetchOccupancy(false);
    } catch (err) {
      const errMsg = err.data?.message || err.data?.error || err.message || 'Check-out failed';
      showToast(errMsg, 'Check-Out Notice');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset gym occupancy to 0
  const handleResetDemo = async () => {
    try {
      await api.resetGymDemo();
      showToast('Gym occupancy counter reset to 0.', 'Occupancy Reset');
      await fetchOccupancy(false);
    } catch (err) {
      console.warn('Reset demo error:', err);
    }
  };

  const isInside = occupancy.userStatus.isInside;
  const checkInTimeFormatted = occupancy.userStatus.checkInTime 
    ? new Date(occupancy.userStatus.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const occupancyStatusType = occupancy.occupancyPercentage >= 90 
    ? 'busy' 
    : occupancy.occupancyPercentage >= 60 
      ? 'moderate' 
      : 'open';

  const occupancyStatusText = occupancy.occupancyPercentage >= 90
    ? 'High Volume (Near Capacity)'
    : occupancy.occupancyPercentage >= 60
      ? 'Moderate Attendance'
      : 'Open Floor (Plenty of Space)';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', backgroundColor: 'var(--bg-canvas)', transition: 'background-color var(--transition-base)' }}>
      
      {/* 1. Header with Eyebrow Pill */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '24px', 
        marginBottom: '36px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div className="pill-eyebrow">
              <span className="dot"></span>
              <span>Facility Telemetry · Real-Time Occupancy</span>
            </div>
            <span style={{ fontSize: '0.80rem', color: '#10B981', fontWeight: 600 }}>
              ● Auto-refreshing every 4s
            </span>
          </div>
          <h1 className="headline-section" style={{ margin: 0 }}>
            Gym Availability & Access
          </h1>
          <p className="text-editorial" style={{ marginTop: '8px', maxWidth: '640px', fontSize: '0.96rem' }}>
            Live occupancy count and spaces remaining. Scan the QR code at the turnstile entrance to record your visit.
          </p>
        </div>

        {/* Clean Pill Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => { setModalTab('plaque'); setShowScannerModal(true); }}
            title="Display printable entrance QR placard"
          >
            <QrCode size={14} /> Entrance Placard
          </Button>

          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => fetchOccupancy(false)} 
            disabled={loading}
            title="Manual refresh"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </Button>

          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleResetDemo}
            title="Reset active sessions"
          >
            <RotateCcw size={13} /> Reset Occupancy
          </Button>
        </div>
      </div>

      {/* 2. MAIN OCCUPANCY EXHIBIT CARD */}
      <section style={{ 
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '36px',
        marginBottom: '36px',
        boxShadow: '0 8px 30px rgba(24, 27, 38, 0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span className="label-micro" style={{ color: '#922756' }}>
              CURRENT OCCUPANCY // {occupancy.gymName.toUpperCase()}
            </span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: occupancyStatusType === 'busy' ? '#FDF2F6' : '#ECFDF5',
            color: occupancyStatusType === 'busy' ? '#922756' : '#059669',
            border: `1px solid ${occupancyStatusType === 'busy' ? '#F5D3E0' : '#A7F3D0'}`,
            padding: '4px 14px',
            borderRadius: '9999px',
            fontSize: '0.80rem',
            fontWeight: 700
          }}>
            <span className={`status-dot status-dot-${occupancyStatusType}`} />
            <span>{occupancyStatusText}</span>
          </div>
        </div>

        {/* 2-Column: Left = Stats & Utilization, Right = Crisp Unfiltered Gym Photo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          {/* Left Column: Big Bold Numerals & Utilization Track */}
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '14px',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(4.2rem, 7vw, 6rem)',
              fontWeight: 800,
              color: '#181B26',
              lineHeight: 1
            }}>
              <span>{occupancy.currentMembers}</span>
              <span style={{ 
                fontSize: '0.45em', 
                color: '#8E95A5', 
                fontWeight: 600 
              }}>
                / {occupancy.capacity}
              </span>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.90rem', color: '#505A69', fontWeight: 500 }}>
              Members currently active on the gym training floor
            </div>

            {/* Capacity Progress Bar */}
            <div style={{ marginTop: '24px', maxWidth: '480px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="label-micro">Capacity Utilization</span>
                <span style={{ fontSize: '0.84rem', color: '#181B26', fontWeight: 700 }}>
                  {occupancy.occupancyPercentage}% Occupied
                </span>
              </div>
              <div className="progress-container" style={{ height: '8px' }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(occupancy.occupancyPercentage, 100)}%`,
                    backgroundColor: occupancy.occupancyPercentage >= 90 ? '#922756' : occupancy.occupancyPercentage >= 60 ? '#F59E0B' : '#10B981'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Right Column: 100% Crisp, Clear Unfiltered Gym Photo */}
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 8px 24px rgba(24, 27, 38, 0.06)'
          }}>
            <img 
              src="/images/mirko-meister-j4T5z94b8ns-unsplash.jpg"
              alt="FitCommit Central Gym Training Floor"
              style={{
                width: '100%',
                height: '240px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)'
            }}>
              <span className="label-micro" style={{ color: 'var(--text-primary)' }}>[ FIG. 02 ] DUMBBELL RACKS & WEIGHT BAYS</span>
              <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                ● LIVE TELEMETRY
              </span>
            </div>
          </div>
        </div>

        {/* Triple Clean Metric Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '18px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '28px'
        }}>
          <div style={{
            padding: '20px 24px',
            backgroundColor: '#FAFBFC',
            border: '1px solid var(--border-color)',
            borderRadius: '16px'
          }}>
            <div className="label-micro" style={{ marginBottom: '6px' }}>Active Members</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: '#181B26', lineHeight: 1 }}>
              {occupancy.currentMembers}
            </div>
            <div style={{ fontSize: '0.80rem', color: '#505A69', marginTop: '6px' }}>
              Currently inside facility
            </div>
          </div>

          <div style={{
            padding: '20px 24px',
            backgroundColor: '#FAFBFC',
            border: '1px solid var(--border-color)',
            borderRadius: '16px'
          }}>
            <div className="label-micro" style={{ marginBottom: '6px' }}>Spaces Available</div>
            <div style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '2.4rem', 
              fontWeight: 800, 
              color: occupancy.availableSpots > 0 ? '#922756' : '#B91C1C', 
              lineHeight: 1 
            }}>
              {occupancy.availableSpots}
            </div>
            <div style={{ fontSize: '0.80rem', color: '#505A69', marginTop: '6px' }}>
              {occupancy.availableSpots > 0 ? 'Open floor slots' : 'Facility at capacity'}
            </div>
          </div>

          <div style={{
            padding: '20px 24px',
            backgroundColor: '#FAFBFC',
            border: '1px solid var(--border-color)',
            borderRadius: '16px'
          }}>
            <div className="label-micro" style={{ marginBottom: '6px' }}>Maximum Capacity</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800, color: '#181B26', lineHeight: 1 }}>
              {occupancy.capacity}
            </div>
            <div style={{ fontSize: '0.80rem', color: '#505A69', marginTop: '6px' }}>
              Safety ceiling limit
            </div>
          </div>
        </div>
      </section>

      {/* 3. USER STATUS & LIVE CHECK-IN PANEL */}
      <section style={{ 
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 4px 20px rgba(24, 27, 38, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '52px', 
            height: '52px', 
            borderRadius: '50%',
            backgroundColor: isInside ? '#ECFDF5' : '#FDF2F6',
            color: isInside ? '#059669' : '#922756',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${isInside ? '#A7F3D0' : '#F5D3E0'}`
          }}>
            {isInside ? (
              <LogIn size={22} />
            ) : (
              <LogOut size={22} />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="badge" style={{
                backgroundColor: isInside ? '#ECFDF5' : '#F8FAFC',
                color: isInside ? '#059669' : '#505A69',
                borderColor: isInside ? '#A7F3D0' : '#E2E8F0'
              }}>
                {isInside ? 'ACTIVE IN-FACILITY SESSION' : 'OFFLINE // OUTSIDE FACILITY'}
              </span>
              <span style={{ fontSize: '0.80rem', color: '#8E95A5' }}>
                • {occupancy.gymName}
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: '#181B26' }}>
              {isInside 
                ? 'You are currently checked in to the gym.' 
                : 'You are currently outside the facility.'}
            </h2>

            <div style={{ fontSize: '0.90rem', color: '#505A69', marginTop: '4px' }}>
              {isInside ? (
                <span>
                  Checked in at <strong>{checkInTimeFormatted || 'Earlier today'}</strong>. Your presence is accounted for in live facility counts.
                </span>
              ) : (
                <span>Scan the entrance QR code displayed at the facility entrance to record attendance.</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isInside ? (
            <Button 
              variant="secondary" 
              onClick={handleCheckOut} 
              disabled={actionLoading}
              style={{ padding: '12px 28px' }}
            >
              <LogOut size={16} /> Check Out Now
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => { setModalTab('camera'); setShowScannerModal(true); setScannerError(null); }}
                style={{ padding: '12px 24px' }}
              >
                <QrCode size={16} /> Scan Gym QR <ArrowRight size={15} />
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleCheckIn('FITCOMMIT-GYM-001')}
                disabled={actionLoading}
                style={{ padding: '12px 20px', border: '1px solid #922756', color: '#922756', fontWeight: 600 }}
                title="Instant Turnstile Check-In without opening camera"
              >
                ⚡ 1-Tap Check-In
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 4. DEDICATED QR ACCESS PROTOCOL EXPLAINER */}
      <section style={{
        backgroundColor: '#FAFBFC',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '36px',
        marginBottom: '36px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'center'
        }}>
          <div>
            <div className="pill-eyebrow" style={{ marginBottom: '12px' }}>
              <span className="dot"></span>
              <span>Contactless Entrance Protocol</span>
            </div>
            <h3 className="headline-section" style={{ fontSize: '1.8rem', margin: '4px 0 14px 0' }}>
              Instant QR check-in & check-out.
            </h3>
            <p className="text-editorial" style={{ fontSize: '0.96rem', lineHeight: 1.65, color: '#505A69', marginBottom: '24px' }}>
              Scan the QR code when you arrive to update the current gym occupancy. Members with an active Smart Pass receive instant validation and live session logging.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button 
                variant="primary" 
                onClick={() => { setModalTab('camera'); setShowScannerModal(true); setScannerError(null); }}
              >
                <QrCode size={15} /> Launch Camera Scanner
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleCheckIn('FITCOMMIT-GYM-001')}
                disabled={actionLoading}
                style={{ border: '1px solid #922756', color: '#922756' }}
              >
                ⚡ 1-Tap Turnstile Access
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => { setModalTab('plaque'); setShowScannerModal(true); }}
              >
                View Entrance Placard <ArrowRight size={15} />
              </Button>
            </div>
          </div>

          {/* Clean White QR Container Card */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '28px',
            textAlign: 'center',
            maxWidth: '360px',
            margin: '0 auto',
            boxShadow: '0 4px 20px rgba(24, 27, 38, 0.04)'
          }}>
            <span className="label-micro" style={{ color: 'var(--primary)' }}>OFFICIAL ACCESS IDENTIFIER</span>
            <div style={{
              display: 'inline-flex',
              padding: '18px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              margin: '16px 0'
            }}>
              <QrCode size={100} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              {occupancy.gymId}
            </div>
            <div style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              FitCommit Central Gym Entrance Turnstile
            </div>
          </div>
        </div>
      </section>



      {/* 6. QR SCANNER & PLACARD MODAL */}
      {showScannerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(24, 27, 38, 0.60)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card)',
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            boxShadow: '0 24px 60px rgba(24, 27, 38, 0.16)',
            padding: '32px',
            borderRadius: '24px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className="label-micro" style={{ color: '#922756' }}>FitCommit Gym Entrance</span>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '4px 0 0 0', color: '#181B26' }}>
                  {modalTab === 'camera' ? 'Scan Gym QR Code' : 'Gym Entrance QR Plaque'}
                </h3>
              </div>
              <button 
                onClick={() => setShowScannerModal(false)}
                style={{ 
                  background: '#F1F4F8', 
                  border: 'none', 
                  fontSize: '1rem', 
                  cursor: 'pointer', 
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#505A69'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Subtabs (Pills) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button
                onClick={() => setModalTab('camera')}
                style={{
                  padding: '8px 18px',
                  border: modalTab === 'camera' ? '1px solid #922756' : '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  background: modalTab === 'camera' ? '#922756' : '#FFFFFF',
                  color: modalTab === 'camera' ? '#FFFFFF' : '#181B26',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.84rem'
                }}
              >
                Optical Camera Scanner
              </button>
              <button
                onClick={() => setModalTab('plaque')}
                style={{
                  padding: '8px 18px',
                  border: modalTab === 'plaque' ? '1px solid #922756' : '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  background: modalTab === 'plaque' ? '#922756' : '#FFFFFF',
                  color: modalTab === 'plaque' ? '#FFFFFF' : '#181B26',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.84rem'
                }}
              >
                Entrance Placard (Display / Print)
              </button>
            </div>

            {/* Error Notification */}
            {scannerError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{scannerError}</span>
              </div>
            )}

            {/* Content Body */}
            {modalTab === 'camera' ? (
              <div>
                <RealCameraQrScanner 
                  onScanSuccess={handleCheckIn}
                  onError={(err) => setScannerError(err)}
                  onClose={() => setShowScannerModal(false)}
                />
              </div>
            ) : (
              <div>
                <GymQrCodePlacard 
                  gymId={occupancy.gymId}
                  gymName={occupancy.gymName}
                  capacity={occupancy.capacity}
                  currentOccupancy={occupancy.currentMembers}
                  compact={true}
                />
              </div>
            )}

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowScannerModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
