import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { 
  Cpu, 
  AlertCircle, 
  CheckCircle, 
  Zap, 
  Battery, 
  Lock, 
  ArrowRight,
  Sparkles,
  RefreshCw 
} from 'lucide-react';

export default function Equipment({ setActivePage }) {
  const { equipmentList, toggleEquipmentSensor, isPremium } = useAuth();
  const { showToast } = useNotifications();

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [togglingId, setTogglingId] = useState(null);
  const [aiAlternatives, setAiAlternatives] = useState({});
  const [loadingAiId, setLoadingAiId] = useState(null);

  const categories = ['ALL', 'Legs', 'Chest', 'Back', 'Full Body', 'Cardio'];

  // Fetch dynamic AI Biomechanical alternative suggestions from backend service
  const fetchAiAlternatives = async (eq) => {
    setLoadingAiId(eq.equipment_id);
    try {
      const res = await api.getAlternativeExercises({
        equipment_id: eq.equipment_id,
        equipment_name: eq.equipment_name,
        category: eq.category
      });
      if (res && res.alternatives) {
        setAiAlternatives(prev => ({
          ...prev,
          [eq.equipment_id]: res
        }));
        showToast(`AI engine generated biomechanical alternatives for ${eq.equipment_name}.`, 'AI Kinematic Match');
      }
    } catch (err) {
      console.warn('AI Alternative fetch note:', err.message);
    } finally {
      setLoadingAiId(null);
    }
  };

  const handleToggle = (eq) => {
    setTogglingId(eq.equipment_id);
    const nextStatus = eq.occupancy_status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    setTimeout(() => {
      toggleEquipmentSensor(eq.equipment_id);
      showToast(`${eq.equipment_name} sensor toggled to ${nextStatus}.`, 'IoT Sensor Event');
      setTogglingId(null);
      if (nextStatus === 'OCCUPIED' && !aiAlternatives[eq.equipment_id]) {
        fetchAiAlternatives(eq);
      }
    }, 200);
  };

  const filteredList = filterCategory === 'ALL'
    ? equipmentList
    : equipmentList.filter(eq => eq.category.toLowerCase() === filterCategory.toLowerCase());

  const occupiedCount = equipmentList.filter(eq => eq.occupancy_status === 'OCCUPIED').length;

  return (
    <div className="page-container" style={{ padding: '40px 32px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
        <div>
          <span className="label-micro">Real-Time Facility Telemetry</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
            Smart Gym Equipment Tracking
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Live occupancy detection across gym equipment with automatic alternative exercise suggestions.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="label-micro">Live Gym Floor Occupancy</span>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            {occupiedCount} / {equipmentList.length} Occupied
          </div>
        </div>
      </div>

      {/* Non-Premium Notice Banner */}
      {!isPremium && (
        <Card style={{
          border: '2px solid #922756',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderRadius: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#922756' }}>
              <Lock size={16} /> Premium Feature Preview
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Base Members can view the floor plan below. Upgrade to Premium for real-time priority alerts and direct trainer coordination.
            </p>
          </div>
          <Button size="sm" onClick={() => setActivePage('membership')}>
            Upgrade to Premium Pass <ArrowRight size={14} />
          </Button>
        </Card>
      )}

      {/* 2. Architectural Separation Notice: QR Attendance vs. Simulated Equipment */}
      <Card style={{
        borderLeft: '4px solid #922756',
        marginBottom: '32px',
        padding: '24px 30px',
        borderRadius: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#922756" />
              <span className="label-micro" style={{ color: '#922756' }}>College Architecture Note • Hardware Sensor Replacement</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '6px', color: '#181B26' }}>
              Simulated Machine Status & AI Exercise Alternatives
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px', maxWidth: '720px', lineHeight: 1.5 }}>
              <strong>Physical Facility Occupancy</strong> is tracked at the entrance via the new <strong>QR-Based Gym Check-In</strong> system. Individual machine statuses below (Available / In Use / Maintenance) are simulated in software to trigger AI alternative exercise recommendations without requiring physical IoT sensors.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActivePage('attendance')}>
            View QR Gym Attendance <ArrowRight size={14} />
          </Button>
        </div>
      </Card>

      {/* Category Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '28px' }}>
        {categories.map((cat, idx) => (
          <Button
            key={idx}
            variant={filterCategory === cat ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* 3. Equipment Grid (7 Machines) */}
      <div className="grid-3" style={{ marginBottom: '40px' }}>
        {filteredList.map((eq) => {
          const isOccupied = eq.occupancy_status === 'OCCUPIED';

          return (
            <Card
              key={eq.equipment_id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: isOccupied ? '1px solid #111111' : '1px solid var(--border-color)',
                backgroundColor: '#FFFFFF',
                position: 'relative'
              }}
            >
              <div>
                {/* Status Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="label-micro">{eq.category}</span>
                  <StatusBadge status={eq.occupancy_status} />
                </div>

                {/* Machine Name */}
                <h3 className="headline-card" style={{ fontSize: '1.35rem', marginBottom: '6px' }}>
                  {eq.equipment_name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                  <span>Sensor #{eq.sensor_id}</span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Battery size={12} /> {eq.battery_level}%
                  </span>
                  <span>•</span>
                  <span>{eq.last_updated}</span>
                </div>

                {/* Occupancy Notice & Alternative Suggestions */}
                {isOccupied ? (
                  <div style={{
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    borderRadius: '2px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#111111',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}>
                        <AlertCircle size={14} /> Station Occupied
                      </div>

                      <button
                        onClick={() => fetchAiAlternatives(eq)}
                        disabled={loadingAiId === eq.equipment_id}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#111111',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Query decoupled AI Recommendation Service"
                      >
                        <Sparkles size={11} /> {loadingAiId === eq.equipment_id ? 'Calculating...' : 'AI Re-Match'}
                      </button>
                    </div>

                    <div className="label-micro" style={{ marginBottom: '6px', color: '#111111' }}>
                      {aiAlternatives[eq.equipment_id] 
                        ? 'AI Biomechanical Substitutes (Live):' 
                        : 'Suggested Biomechanical Substitutes:'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(aiAlternatives[eq.equipment_id]?.alternatives || eq.alternatives).map((alt, aIdx) => (
                        <div key={aIdx} style={{ fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: 600 }}>• {alt.suggested_exercise_name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                            {alt.biomechanical_match || alt.instructions}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    padding: '16px',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px',
                    border: '1px dashed var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111111', fontWeight: 600, marginBottom: '4px' }}>
                      <CheckCircle size={14} /> Station Free for Use
                    </div>
                    Proceed directly to equipment in the Flagship gym facility.
                  </div>
                )}
              </div>

              {/* IoT Simulator Trigger Button */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid #ECECEA' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  block
                  icon={Zap}
                  loading={togglingId === eq.equipment_id}
                  onClick={() => handleToggle(eq)}
                  style={{ fontSize: '0.72rem' }}
                >
                  Simulate Sensor Flip (Set {isOccupied ? 'Available' : 'Occupied'})
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
