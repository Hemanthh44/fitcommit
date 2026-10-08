import React from 'react';

export function Card({ children, className = '', style = {}, onClick, padding = 'normal', border = true }) {
  const paddingMap = {
    none: '0',
    tight: '16px 20px',
    normal: '24px 28px',
    spacious: '36px 40px'
  };

  return (
    <div
      onClick={onClick}
      className={`card ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        border: border ? '1px solid var(--border-color)' : 'none',
        borderRadius: '20px',
        padding: paddingMap[padding] || paddingMap.normal,
        boxShadow: 'var(--shadow-sm)',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function MetricCard({ label, value, unit, subtitle, icon: Icon, onClick }) {
  return (
    <Card onClick={onClick} padding="tight" style={{ borderRadius: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label-micro" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {Icon && (
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-soft)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="metric-value" style={{ marginTop: '10px', color: 'var(--text-primary)' }}>
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-main)' }}>
          {subtitle}
        </div>
      )}
    </Card>
  );
}

export function CardHeader({ title, subtitle, badge, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        {subtitle && (
          <div className="label-micro" style={{ marginBottom: '4px', color: 'var(--primary)' }}>
            {subtitle}
          </div>
        )}
        <h3 className="headline-card" style={{ fontSize: '1.35rem', color: '#181B26' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {badge}
        {action}
      </div>
    </div>
  );
}
