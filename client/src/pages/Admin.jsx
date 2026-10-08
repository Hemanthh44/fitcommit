import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { INITIAL_PERSONAS } from '../data/mockData';
import { Card, MetricCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/Table';
import { GymQrCodePlacard } from '../components/GymQrCodePlacard';
import { 
  ShieldAlert, 
  Users, 
  Cpu, 
  Activity, 
  CheckCircle, 
  Lock, 
  RefreshCw,
  Zap,
  Sliders,
  QrCode,
  LogIn,
  LogOut,
  Clock,
  UserCheck,
  Building
} from 'lucide-react';

export default function Admin({ setActivePage }) {
  const { user, isAdmin, demoLogin, equipmentList, toggleEquipmentSensor } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('occupancy'); // occupancy, users, equipment
  const [userList, setUserList] = useState(INITIAL_PERSONAS);
  const [metrics, setMetrics] = useState(null);
  const [gymOccupancy, setGymOccupancy] = useState({
    gym: { gym_name: 'FitCommit Central Gym', capacity: 100 },
    occupancy: {
      current_occupancy: 24,
      capacity: 100,
      occupancy_percentage: 24,
      available_spots: 76,
      total_members: 150,
      check_ins_today: 48,
      check_outs_today: 24
    },
    recent_activity: []
  });
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async (isBackground = false) => {
    if (!isAdmin) return;
    if (!isBackground) setLoading(true);
    try {
      const [usersRes, metricsRes, gymOccRes, gymAttRes] = await Promise.all([
        api.getAdminUsers().catch(() => null),
        api.getAdminMetrics().catch(() => null),
        api.getAdminGymOccupancy().catch(() => null),
        api.getAdminGymAttendance().catch(() => null)
      ]);

      if (usersRes && usersRes.users && usersRes.users.length > 0) {
        setUserList(usersRes.users);
      }
      if (metricsRes && metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
      }
      if (gymOccRes && gymOccRes.occupancy) {
        setGymOccupancy(gymOccRes);
      }
      if (gymAttRes && gymAttRes.attendance) {
        setAllAttendance(gymAttRes.attendance);
      }
    } catch (err) {
      console.warn('Admin API sync notice:', err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(false);
    const interval = setInterval(() => {
      fetchAdminData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === 'BASE_MEMBER' ? 'PREMIUM_MEMBER' : 'BASE_MEMBER';
    try {
      await api.updateAdminUser(targetUser.user_id, { role: newRole });
      setUserList(prev => prev.map(u => u.user_id === targetUser.user_id ? { ...u, role: newRole } : u));
      showToast(`User ${targetUser.name} role switched to ${newRole} in DB.`, 'Admin Updated');
      fetchAdminData();
    } catch (err) {
      setUserList(prev => prev.map(u => u.user_id === targetUser.user_id ? { ...u, role: newRole } : u));
      showToast(`User ${targetUser.name} role switched to ${newRole}.`, 'Admin Updated');
    }
  };

  const handleEquipmentOverride = async (eqId) => {
    await toggleEquipmentSensor(eqId);
    showToast(`Machine #${eqId} occupancy toggled by admin hardware override.`, 'Equipment Overridden');
  };

  if (!isAdmin) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: '540px', textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <Lock size={24} color="#111111" />
          </div>
          <span className="label-micro">Administrator Authorization Required</span>
          <h2 className="headline-section" style={{ fontSize: '1.8rem', marginTop: '8px', marginBottom: '12px' }}>
            Restricted Admin Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '28px' }}>
            You are currently authenticated as <strong>{user?.name}</strong> with role <strong>{user?.role}</strong>. Administrator privilege is required to access system management.
          </p>
          <Button variant="primary" block onClick={() => demoLogin('admin')}>
            Switch to Admin Access
          </Button>
        </Card>
      </div>
    );
  }

  const occupiedCount = equipmentList.filter(e => e.occupancy_status === 'OCCUPIED').length;
  const occ = gymOccupancy.occupancy;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div>
          <span className="label-micro">FitCommit Admin Control Room</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
            System Administration & Telemetry
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Real-time QR gym occupancy oversight, user access moderation, and simulated hardware equipment status.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => { fetchAdminData(); showToast('Telemetry synchronized from database.', 'Refreshed'); }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Telemetry
        </Button>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <button
          onClick={() => setActiveTab('occupancy')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'occupancy' ? '2px solid #922756' : '2px solid transparent',
            fontWeight: activeTab === 'occupancy' ? 700 : 500,
            color: activeTab === 'occupancy' ? '#922756' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <QrCode size={16} /> Gym Occupancy & Telemetry
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'generator' ? '2px solid #922756' : '2px solid transparent',
            fontWeight: activeTab === 'generator' ? 700 : 500,
            color: activeTab === 'generator' ? '#922756' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Building size={16} /> Gym Management & QR Plaque
        </button>

        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #922756' : '2px solid transparent',
            fontWeight: activeTab === 'users' ? 700 : 500,
            color: activeTab === 'users' ? '#922756' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} /> User Moderation ({userList.length})
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'equipment' ? '2px solid #922756' : '2px solid transparent',
            fontWeight: activeTab === 'equipment' ? 700 : 500,
            color: activeTab === 'equipment' ? '#922756' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Cpu size={16} /> Equipment Hardware Status
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GYM OCCUPANCY DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'occupancy' && (
        <div>
          {/* Top Metrics Row */}
          <div className="grid-4" style={{ marginBottom: '32px' }}>
            <MetricCard
              label="Members Currently Inside"
              value={`${occ.current_occupancy} / ${occ.capacity}`}
              unit={`(${occ.occupancy_percentage}%)`}
              subtext={`${occ.available_spots} available spots`}
            />

            <MetricCard
              label="Today's Check-ins"
              value={occ.check_ins_today}
              subtext="Total entrances scanned today"
            />

            <MetricCard
              label="Active Registered Members"
              value={occ.total_members}
              subtext="Holders of active gym passes"
            />

            <MetricCard
              label="Today's Check-outs"
              value={occ.check_outs_today}
              subtext="Completed sessions today"
            />
          </div>

          {/* Occupancy Visual Progress & Facility Status Card */}
          <Card style={{ padding: '28px 32px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span className="label-micro">FitCommit Central Gym Live Occupancy Status</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2px' }}>
                  Floor Congestion & Capacity Ratio
                </h3>
              </div>
              <span className="badge" style={{ backgroundColor: '#111111', color: '#FFFFFF', fontSize: '11px' }}>
                {occ.occupancy_percentage}% OCCUPIED
              </span>
            </div>

            {/* Minimal Progress Bar */}
            <div style={{ width: '100%', height: '10px', backgroundColor: '#EFEFEF', borderRadius: '5px', overflow: 'hidden', marginBottom: '14px' }}>
              <div 
                style={{ 
                  width: `${Math.min(occ.occupancy_percentage, 100)}%`, 
                  height: '100%', 
                  backgroundColor: occ.occupancy_percentage > 85 ? '#DC2626' : '#111111',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>0 (Empty)</span>
              <span>Available Capacity: <strong>{occ.available_spots}</strong> / {occ.capacity}</span>
              <span>{occ.capacity} (Full Limit)</span>
            </div>
          </Card>

          {/* Dual Grid: Recent Activity Stream + Quick Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            
            {/* Recent Check-Ins & Check-Outs Feed */}
            <Card style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <span className="label-micro">Live Attendance Stream</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '2px 0 0 0' }}>Recent Activity</h4>
                </div>
                <span className="badge" style={{ fontSize: '10px' }}>CHRONOLOGICAL</span>
              </div>

              {gymOccupancy.recent_activity && gymOccupancy.recent_activity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {gymOccupancy.recent_activity.map((act) => (
                    <div 
                      key={act.attendance_id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '10px 14px',
                        backgroundColor: '#F9F9F8',
                        border: '1px solid #ECECEA',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          backgroundColor: act.activity_type === 'CHECKED_IN' ? '#111111' : '#E5E5E5',
                          color: act.activity_type === 'CHECKED_IN' ? '#FFFFFF' : '#333333',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          {act.activity_type === 'CHECKED_IN' ? <LogIn size={13} /> : <LogOut size={13} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{act.user_name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{act.user_email}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className="badge" style={{ 
                          fontSize: '9px',
                          backgroundColor: act.activity_type === 'CHECKED_IN' ? 'rgba(74, 222, 128, 0.2)' : '#ECECEA',
                          color: act.activity_type === 'CHECKED_IN' ? '#15803D' : '#666666'
                        }}>
                          {act.activity_type === 'CHECKED_IN' ? 'Checked In' : 'Checked Out'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {act.activity_time_formatted}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>
                  No recent activity logged yet.
                </div>
              )}
            </Card>

            {/* Architecture Explanatory Card */}
            <Card style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="label-micro">Facility Telemetry Architecture</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '2px 0 12px 0' }}>
                  Occupancy vs. Total Members Rule
                </h4>
                
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>1. Total Members ({occ.total_members}):</strong> Users with an active gym pass. Remains steady when members enter or leave.
                  </p>
                  <p style={{ margin: '0 0 10px 0' }}>
                    <strong>2. Current Occupancy ({occ.current_occupancy}):</strong> Dynamically computed via <code style={{ fontSize: '11px' }}>COUNT(*) WHERE status = 'CHECKED_IN'</code>.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>3. QR Plaque Verification:</strong> Physical facility turnstiles and occupancy counters synchronize seamlessly via digital QR verification (<code style={{ fontSize: '11px' }}>FITCOMMIT-GYM-001</code>).
                  </p>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#111111', 
                color: '#FFFFFF', 
                padding: '16px 20px', 
                borderRadius: '4px',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#AAAAAA' }}>
                    Active Gym QR Identifier
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', marginTop: '2px' }}>
                    FITCOMMIT-GYM-001
                  </div>
                </div>
                <Button size="xs" variant="outline" onClick={() => setActiveTab('generator')} style={{ borderColor: '#555555', color: '#FFFFFF' }}>
                  Open QR Plaque Generator →
                </Button>
              </div>
            </Card>

          </div>

          {/* Full Attendance History Ledger */}
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="label-micro">Complete Database Audit</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '2px' }}>
                  Attendance Log (Recent 50 Events)
                </h3>
              </div>
              <Badge variant="outline">{allAttendance.length} RECORDS</Badge>
            </div>

            <Table>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Member</Th>
                  <Th>Date</Th>
                  <Th>Check In</Th>
                  <Th>Check Out</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {allAttendance.slice(0, 20).map((record) => (
                  <Tr key={record.attendance_id}>
                    <Td style={{ fontFamily: 'monospace' }}>#{record.attendance_id}</Td>
                    <Td>
                      <div style={{ fontWeight: 600 }}>{record.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{record.email}</div>
                    </Td>
                    <Td>{record.date_formatted}</Td>
                    <Td>{record.check_in_time_formatted}</Td>
                    <Td>{record.check_out_time_formatted || '— Inside Gym —'}</Td>
                    <Td style={{ fontFamily: 'monospace' }}>{record.session_duration_formatted}</Td>
                    <Td>
                      <span className="badge" style={{
                        backgroundColor: record.status === 'CHECKED_IN' ? '#111111' : '#F0F0EE',
                        color: record.status === 'CHECKED_IN' ? '#FFFFFF' : '#444444',
                        border: 'none',
                        fontSize: '10px'
                      }}>
                        {record.status === 'CHECKED_IN' ? 'CHECKED IN' : 'COMPLETED'}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GYM MANAGEMENT & REAL QR GENERATOR                 */}
      {/* ========================================================= */}
      {activeTab === 'generator' && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '28px' }}>
            <span className="label-micro">Admin → Gym Management Portal</span>
            <h2 className="headline-section" style={{ fontSize: '1.8rem', marginTop: '4px' }}>
              Entrance Plaque & Real Scannable QR Code
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Real QR code encoded for physical phone cameras. Download as a high-resolution PNG or print the official door placard.
            </p>
          </div>

          <GymQrCodePlacard 
            gymId="FITCOMMIT-GYM-001"
            gymName={gymOccupancy.gym?.gym_name || 'FitCommit Central Gym'}
            capacity={occ.capacity}
            currentOccupancy={occ.current_occupancy}
            compact={false}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: USER MANAGEMENT & ROLE MODERATION                 */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <Card style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="label-micro">User Access Control</span>
              <h2 className="headline-card" style={{ marginTop: '4px' }}>Registered Accounts & Membership Tier</h2>
            </div>
            <Badge variant="outline">{userList.length} USERS</Badge>
          </div>

          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Assigned Role</Th>
                <Th>Account Status</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {userList.map((u) => (
                <Tr key={u.user_id}>
                  <Td>#{u.user_id}</Td>
                  <Td style={{ fontWeight: 600 }}>{u.name}</Td>
                  <Td style={{ color: 'var(--text-secondary)' }}>{u.email}</Td>
                  <Td>
                    <Badge variant={u.role === 'ADMIN' ? 'dark' : 'outline'}>{u.role}</Badge>
                  </Td>
                  <Td>
                    <StatusBadge status={u.account_status || 'ACTIVE'} />
                  </Td>
                  <Td style={{ textAlign: 'right' }}>
                    {u.role !== 'ADMIN' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserRole(u)}
                        style={{ fontSize: '0.72rem' }}
                      >
                        Toggle {u.role === 'BASE_MEMBER' ? 'to Premium' : 'to Base'}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 3: EQUIPMENT HARDWARE STATUS                           */}
      {/* ========================================================= */}
      {activeTab === 'equipment' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="label-micro">Software Simulated Equipment Occupancy</span>
              <h2 className="headline-card" style={{ marginTop: '4px' }}>Gym Machine Availability</h2>
            </div>
            <Badge variant="outline">{equipmentList.length} MACHINES MONITORED</Badge>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Note: Facility attendance is tracked via QR entrance scanning. Individual machine availability below is simulated in software to demonstrate adaptive exercise recommendation triggers.
          </p>

          <Table>
            <Thead>
              <Tr>
                <Th>Equipment</Th>
                <Th>Category</Th>
                <Th>Simulated Status</Th>
                <Th>Battery</Th>
                <Th style={{ textAlign: 'right' }}>Hardware Override</Th>
              </Tr>
            </Thead>
            <Tbody>
              {equipmentList.map((eq) => (
                <Tr key={eq.equipment_id}>
                  <Td style={{ fontWeight: 600 }}>{eq.equipment_name}</Td>
                  <Td>{eq.category}</Td>
                  <Td>
                    <StatusBadge status={eq.occupancy_status} />
                  </Td>
                  <Td>{eq.battery_level}%</Td>
                  <Td style={{ textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEquipmentOverride(eq.equipment_id)}
                      style={{ fontSize: '0.72rem' }}
                    >
                      Simulate Status Flip
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

    </div>
  );
}
