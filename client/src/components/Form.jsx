import React from 'react';

export function FormField({ label, hint, error, children, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', ...style }}>
      {label && <label className="form-label">{label}</label>}
      {children}
      {hint && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{hint}</span>}
      {error && <span style={{ fontSize: '0.75rem', color: '#111111', fontWeight: 600 }}>{error}</span>}
    </div>
  );
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  step,
  name,
  disabled = false,
  style = {},
  className = ''
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={`form-input ${className}`}
      style={{
        padding: '12px 14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xs)',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
        ...style
      }}
    />
  );
}

export function Select({
  value,
  onChange,
  name,
  children,
  required = false,
  disabled = false,
  style = {}
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="form-select"
      style={{
        padding: '12px 14px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xs)',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
        cursor: 'pointer',
        ...style
      }}
    >
      {children}
    </select>
  );
}

export function Textarea({
  value,
  onChange,
  name,
  placeholder,
  rows = 3,
  required = false,
  style = {}
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="form-input"
      style={{
        padding: '12px 14px',
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xs)',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
        resize: 'vertical',
        ...style
      }}
    />
  );
}
