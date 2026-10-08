import React from 'react';

export function BarChart({
  data = [],
  xKey = 'label',
  yKey = 'value',
  height = 160,
  maxVal = null,
  activeKey = null
}) {
  const calculatedMax = maxVal || Math.max(...data.map(d => d[yKey] || 0), 10);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          height: `${height}px`,
          padding: '0 10px',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        {data.map((item, idx) => {
          const val = item[yKey] || 0;
          const heightPct = Math.min(100, Math.max(10, (val / calculatedMax) * 100));
          const isActive = activeKey ? item[activeKey] : true;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {val}
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: '38px',
                  height: `${heightPct}%`,
                  backgroundColor: isActive ? '#922756' : '#E2E8F0',
                  borderRadius: '8px 8px 0 0',
                  transition: 'height var(--transition-base), background-color var(--transition-fast)'
                }}
                title={`${item[xKey]}: ${val}`}
              />
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  marginTop: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                {item[xKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendLineChart({ data = [], height = 140 }) {
  if (!data || data.length === 0) return null;

  const minVal = Math.min(...data.map(d => d.value)) - 0.5;
  const maxVal = Math.max(...data.map(d => d.value)) + 0.5;
  const range = maxVal - minVal || 1;

  const points = data.map((d, idx) => {
    const x = (idx / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((d.value - minVal) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Subtle grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" stroke="#EAEAEA" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#EAEAEA" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#EAEAEA" strokeWidth="0.5" strokeDasharray="2,2" />

        {/* Pure minimalist black trendline */}
        <polyline
          fill="none"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {data.map((d, idx) => {
          const x = (idx / Math.max(1, data.length - 1)) * 100;
          const y = 100 - ((d.value - minVal) / range) * 100;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="2"
              fill="#111111"
              stroke="#FFFFFF"
              strokeWidth="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
}
