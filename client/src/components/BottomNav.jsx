import React from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Apple, 
  QrCode, 
  Menu
} from 'lucide-react';

export default function BottomNav({ activePage, setActivePage, onOpenMenu }) {
  const navTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'attendance', label: 'Gym QR', icon: QrCode },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 0px)) 8px',
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box'
      }}
    >
      {navTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activePage === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePage(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              padding: '6px 4px',
              borderRadius: '12px',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              touchAction: 'manipulation'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '24px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
                transition: 'background-color 0.18s ease'
              }}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.01em',
                lineHeight: 1
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* More / All Tools Drawer Trigger */}
      <button
        type="button"
        onClick={onOpenMenu}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          background: 'none',
          border: 'none',
          padding: '6px 4px',
          borderRadius: '12px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          touchAction: 'manipulation'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '24px'
          }}
        >
          <Menu size={19} strokeWidth={2} />
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1
          }}
        >
          More
        </span>
      </button>
    </nav>
  );
}
