import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  Moon, 
  Sun,
  QrCode
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isPremium, isAdmin, logout, demoLogin } = useAuth();
  const { unreadCount } = useNotifications();
  const { toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);

  const handleNav = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const handleSwitchPersona = async (role) => {
    await demoLogin(role);
    setPersonaOpen(false);
    setActivePage('dashboard');
  };

  // Get initials for user avatar
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FC';

  return (
    <header style={{
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      boxShadow: 'var(--shadow-sm)',
      transition: 'background-color var(--transition-base), border-color var(--transition-base)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => handleNav(user ? 'dashboard' : 'landing')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
            title="FitCommit"
            aria-label="FitCommit Home"
          >
            <img 
              src={isDark ? '/images/fitcommit-logo-dark.png' : '/images/fitcommit-logo.png'}
              alt="FitCommit"
              style={{
                height: '42px',
                width: 'auto',
                maxWidth: '190px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </button>
        </div>

        {/* Right Section: Dark/Light Mode + Who is User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Functional Dark/Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'var(--bg-muted)',
              border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-color)'}`,
              color: isDark ? '#F59E0B' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              boxShadow: isDark ? '0 0 14px rgba(245, 158, 11, 0.25)' : 'none'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={19} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              {/* QR Check-In Quick Action */}
              <button
                onClick={() => handleNav('attendance')}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Open Gym Check-In"
              >
                <QrCode size={14} /> 
                <span className="hide-on-mobile">Check In</span>
              </button>

              {/* Notification Button */}
              <button
                onClick={() => handleNav('notifications')}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  transition: 'all var(--transition-fast)'
                }}
                title="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: '9px',
                    fontWeight: 700,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{unreadCount}</span>
                )}
              </button>

              {/* WHO IS THE USER: User Capsule & Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setPersonaOpen(!personaOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '5px 12px 5px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  title="View User Details & Roles"
                >
                  {/* User Avatar Circle */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.80rem',
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 6px rgba(146, 39, 86, 0.25)'
                  }}>
                    {userInitials}
                  </div>

                  {/* User Info Label */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.2 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      color: 'var(--text-primary)'
                    }}>
                      {user.name}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: user.role === 'PREMIUM_MEMBER' ? 'var(--primary)' : 'var(--text-muted)'
                    }}>
                      {user.role === 'PREMIUM_MEMBER' ? 'PREMIUM PASS' : user.role === 'TRAINER' ? 'COACH' : user.role === 'ADMIN' ? 'ADMIN' : 'BASE TIER'}
                    </span>
                  </div>

                  <ChevronDown 
                    size={14} 
                    color="var(--text-secondary)" 
                    style={{ 
                      transform: personaOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 180ms ease' 
                    }} 
                  />
                </button>

                {/* User Details Dropdown Menu */}
                {personaOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '18px',
                    width: '280px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '10px',
                    zIndex: 250
                  }}>
                    {/* Identity Header */}
                    <div style={{ padding: '8px 12px 10px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.88rem'
                        }}>
                          {userInitials}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{
                          fontSize: '0.70rem',
                          backgroundColor: user.role === 'PREMIUM_MEMBER' ? 'var(--primary-soft)' : 'var(--bg-muted)',
                          color: user.role === 'PREMIUM_MEMBER' ? 'var(--primary)' : 'var(--text-secondary)',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontWeight: 700,
                          border: `1px solid ${user.role === 'PREMIUM_MEMBER' ? 'var(--primary-border)' : 'var(--border-color)'}`
                        }}>
                          {user.role === 'PREMIUM_MEMBER' ? '★ PREMIUM PASS' : user.role === 'TRAINER' ? 'COACH' : user.role === 'ADMIN' ? 'ADMIN' : 'BASE TIER'}
                        </span>
                        <span style={{ fontSize: '0.70rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Switch User Role */}
                    <div style={{ padding: '4px 12px 4px 12px' }}>
                      <div className="label-micro" style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '4px' }}>
                        Switch User Role
                      </div>
                    </div>
                    <button
                      onClick={() => handleSwitchPersona('base')}
                      className="persona-option"
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>Hemanth Sai Krishna</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Base Member (Free Tier)</div>
                    </button>
                    <button
                      onClick={() => handleSwitchPersona('premium')}
                      className="persona-option"
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>Sumith Raj</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Premium Member (Smart Gym)</div>
                    </button>
                    <button
                      onClick={() => handleSwitchPersona('trainer')}
                      className="persona-option"
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>Arun Abhishek</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fitness Coach</div>
                    </button>
                    <button
                      onClick={() => handleSwitchPersona('admin')}
                      className="persona-option"
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>Bheem Sagar</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Administrator</div>
                    </button>

                    {/* Actions */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '6px', paddingTop: '6px' }}>
                      <button
                        onClick={() => { setPersonaOpen(false); handleNav('profile'); }}
                        className="persona-option"
                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 500 }}
                      >
                        <UserIcon size={14} color="var(--primary)" /> Profile & Goals
                      </button>
                      <button
                        onClick={() => { setPersonaOpen(false); logout(); handleNav('landing'); }}
                        className="persona-option"
                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontSize: '0.82rem', fontWeight: 500 }}
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => handleNav('login')} 
                className="btn btn-secondary btn-sm"
              >
                Sign In
              </button>
              <button 
                onClick={() => handleNav('register')} 
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 20px' }}
              >
                Register Pass
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger (Visible on small screens) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              color: 'var(--text-primary)'
            }}
            className="mobile-nav-toggle"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {user ? (
            <>
              <button onClick={() => handleNav('dashboard')} className="mobile-link">Dashboard</button>
              <button onClick={() => handleNav('attendance')} className="mobile-link">Gym Availability (QR)</button>
              <button onClick={() => handleNav('workout')} className="mobile-link">Adaptive Workouts</button>
              <button onClick={() => handleNav('nutrition')} className="mobile-link">Diet & Macros</button>
              <button onClick={() => handleNav('bmi')} className="mobile-link">BMI Tracker</button>
              <button onClick={() => handleNav('progress')} className="mobile-link">Progress Analytics</button>
              <button onClick={() => handleNav('equipment')} className="mobile-link">Smart Gym Equipment</button>
              {isPremium && (
                <>
                  <button onClick={() => handleNav('trainer')} className="mobile-link">Personal Trainer</button>
                  <button onClick={() => handleNav('supplements')} className="mobile-link">Supplement Discounts</button>
                </>
              )}
              <button onClick={() => handleNav('membership')} className="mobile-link">Membership Plans</button>
              {isAdmin && (
                <button onClick={() => handleNav('admin')} className="mobile-link">Admin Portal</button>
              )}
              <button onClick={() => handleNav('profile')} className="mobile-link">Profile Settings</button>
            </>
          ) : (
            <>
              <button onClick={() => handleNav('landing')} className="mobile-link">Home</button>
              <button onClick={() => handleNav('login')} className="mobile-link">Sign In</button>
              <button onClick={() => handleNav('register')} className="mobile-link">Register Pass</button>
            </>
          )}
        </div>
      )}

      <style>{`
        .mobile-nav-toggle {
          display: none !important;
        }
        .persona-option:hover {
          background-color: var(--primary-soft) !important;
        }
        .mobile-link {
          text-align: left;
          background: none;
          border: none;
          padding: 10px 0;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }
        @media (max-width: 960px) {
          .mobile-nav-toggle {
            display: flex !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
