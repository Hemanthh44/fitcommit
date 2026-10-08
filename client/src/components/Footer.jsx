import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Footer({ setActivePage }) {
  const { isDark } = useTheme();

  return (
    <footer style={{
      backgroundColor: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
      padding: '64px 0 32px 0',
      marginTop: '80px',
      color: 'var(--text-primary)',
      transition: 'background-color var(--transition-base), border-color var(--transition-base)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '48px'
        }}>
          {/* Brand info */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <img 
                src={isDark ? '/images/fitcommit-logo-dark.png' : '/images/fitcommit-logo.png'} 
                alt="FitCommit"
                style={{
                  height: '40px',
                  width: 'auto',
                  maxWidth: '180px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            <p style={{ fontSize: '0.90rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '300px' }}>
              Adaptive fitness and real-time gym telemetry. Built for sustainable wellness with dynamic volume scaling and turnstile access control.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge">Smart Gym Access</span>
              <span className="badge">Real-Time Telemetry</span>
              <span className="badge">AI Powered</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="label-micro" style={{ marginBottom: '14px', color: 'var(--primary)' }}>Quick Links</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div><a href="#dashboard" onClick={(e) => { e.preventDefault(); setActivePage?.('dashboard'); }} style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</a></div>
              <div><a href="#workout" onClick={(e) => { e.preventDefault(); setActivePage?.('workout'); }} style={{ color: 'inherit', textDecoration: 'none' }}>Adaptive Workouts</a></div>
              <div><a href="#nutrition" onClick={(e) => { e.preventDefault(); setActivePage?.('nutrition'); }} style={{ color: 'inherit', textDecoration: 'none' }}>Nutrition & AI Meals</a></div>
              <div><a href="#attendance" onClick={(e) => { e.preventDefault(); setActivePage?.('attendance'); }} style={{ color: 'inherit', textDecoration: 'none' }}>Gym Attendance & QR</a></div>
            </div>
          </div>

          {/* Platform Capabilities */}
          <div>
            <div className="label-micro" style={{ marginBottom: '14px', color: 'var(--primary)' }}>Platform Features</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div>• Multimodal AI Food Recognition</div>
              <div>• Contactless Turnstile QR Access</div>
              <div>• Live Facility Occupancy Tracking</div>
              <div>• Biometric & BMI Trend Analysis</div>
            </div>
          </div>

          {/* System Security */}
          <div>
            <div className="label-micro" style={{ marginBottom: '14px', color: 'var(--primary)' }}>Security & Privacy</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 2 }}>
              <div>• Encrypted Biometric Storage</div>
              <div>• Tokenized Access Authentication</div>
              <div>• Role-Based Access Control</div>
              <div>• Real-Time Facility Telemetry</div>
            </div>
          </div>
        </div>

        <div className="hairline" style={{ margin: '24px 0' }} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.84rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © 2026 FitCommit System. Clean healthcare & wellness design system.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>DPDP Act Adherent</span>
            <span>PCI-DSS Simulated</span>
            <span>Real-Time Telemetry</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
