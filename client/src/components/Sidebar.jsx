import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Apple, 
  Scale, 
  BarChart3, 
  Cpu, 
  Users, 
  Tag, 
  CreditCard, 
  Bell, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut,
  QrCode
} from 'lucide-react';

export function Sidebar({ activePage, setActivePage }) {
  const { user, isPremium, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Gym Availability', icon: QrCode, badge: 'LIVE' },
    { id: 'workout', label: 'Adaptive Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'AI Meal & Nutrition', icon: Apple, badge: 'AI' },
    { id: 'bmi', label: 'BMI Tracker', icon: Scale },
    { id: 'progress', label: 'Progress Analytics', icon: BarChart3 },
  ];

  const premiumItems = [
    { id: 'equipment', label: 'Smart Gym Equipment', icon: Cpu, badge: 'IoT' },
    { id: 'trainer', label: 'Personal Trainer', icon: Users, badge: isPremium ? 'PRO' : 'LOCK' },
    { id: 'supplements', label: 'Supplement Offers', icon: Tag, badge: isPremium ? 'PRO' : 'LOCK' },
    { id: 'membership', label: 'Membership Plans', icon: CreditCard },
  ];

  return (
    <aside
      className="app-sidebar"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}
    >
      <div>
        {/* User Profile Summary */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="label-micro" style={{ marginBottom: '4px', color: 'var(--text-muted)' }}>Logged in as</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {user.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: isPremium ? 'var(--primary-soft)' : 'var(--bg-muted)',
              color: isPremium ? 'var(--primary)' : 'var(--text-secondary)',
              border: `1px solid ${isPremium ? 'var(--primary-border)' : 'var(--border-color)'}`
            }}>
              {user.role === 'PREMIUM_MEMBER' ? 'PREMIUM SMART PASS' : user.role === 'TRAINER' ? 'CERTIFIED COACH' : user.role === 'ADMIN' ? 'ADMIN' : 'BASE TIER'}
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <div style={{ padding: '16px 14px' }}>
          <div className="label-micro" style={{ padding: '0 8px 8px 8px', color: 'var(--text-muted)' }}>Platform Navigation</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '9999px',
                    border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.86rem',
                    letterSpacing: '-0.01em',
                    textTransform: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="sidebar-link"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-muted)',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      padding: '2px 7px',
                      borderRadius: '9999px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hairline" style={{ margin: '16px 0' }} />

          {/* Premium / Smart Gym Section */}
          <div className="label-micro" style={{ padding: '0 8px 8px 8px', color: 'var(--text-muted)' }}>Smart Facility Services</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {premiumItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '9999px',
                    border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.86rem',
                    letterSpacing: '-0.01em',
                    textTransform: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="sidebar-link"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: isActive ? 'var(--primary)' : 'var(--bg-muted)',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      padding: '2px 7px',
                      borderRadius: '9999px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="hairline" style={{ margin: '16px 0' }} />
              <div className="label-micro" style={{ padding: '0 8px 8px 8px', color: 'var(--text-muted)' }}>Administration</div>
              <button
                onClick={() => setActivePage('admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '9999px',
                  border: activePage === 'admin' ? '1px solid var(--primary-border)' : '1px solid transparent',
                  backgroundColor: activePage === 'admin' ? 'var(--primary-soft)' : 'transparent',
                  color: activePage === 'admin' ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <ShieldCheck size={16} color="var(--primary)" />
                <span>Admin Portal</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer Utilities */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActivePage('notifications')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            borderRadius: '9999px',
            color: activePage === 'notifications' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activePage === 'notifications' ? 700 : 500,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: '9px',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontWeight: 700
            }}>{unreadCount}</span>
          )}
        </button>

        <button
          onClick={() => setActivePage('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            borderRadius: '9999px',
            color: activePage === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activePage === 'profile' ? 700 : 500,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <UserIcon size={16} />
          <span>Profile & Goals</span>
        </button>

        <button
          onClick={() => { logout(); setActivePage('landing'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            borderRadius: '9999px',
            color: 'var(--text-muted)',
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
