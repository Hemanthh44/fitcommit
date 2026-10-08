import React from 'react';

export function ProgressBar({ value = 0, max = 100, height = 7, color = '#922756', style = {} }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#F1F4F8',
        borderRadius: '9999px',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '9999px',
          transition: 'width var(--transition-base)'
        }}
      />
    </div>
  );
}

export function CommitmentMeter({ score = 82, target = 75 }) {
  const isOptimal = score >= target;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span className="label-micro" style={{ color: '#922756' }}>Your Commitment This Week</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#181B26' }}>
          {score}%
        </span>
      </div>

      <ProgressBar value={score} height={8} color={isOptimal ? '#059669' : '#922756'} />

      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Target: {target}% Adherence</span>
        <span style={{ fontWeight: 700, color: isOptimal ? '#059669' : '#922756' }}>
          {isOptimal ? 'Optimal Adherence' : 'Volume De-Escalated'}
        </span>
      </div>
    </div>
  );
}

export function MacroBar({ label, current, target, unit = 'g', subtext }) {
  const pct = Math.min(100, Math.max(0, (current / Math.max(1, target)) * 100));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
        <span style={{ fontWeight: 600, color: '#181B26' }}>{label}</span>
        <span style={{ color: '#505A69' }}>
          <strong style={{ color: '#181B26' }}>{current}{unit}</strong> / {target}{unit}
        </span>
      </div>
      <ProgressBar value={pct} height={7} />
      {subtext && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
