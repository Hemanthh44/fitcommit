import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon,
  style = {},
  className = ''
}) {
  const baseStyle = {
    display: inlineBlockDisplay(block),
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '9999px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    textTransform: 'none',
    fontWeight: 600,
    fontFamily: 'var(--font-main)',
    ...getSizeStyle(size),
    ...getVariantStyle(variant),
    ...style
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={baseStyle}
      className={`btn-component ${className}`}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {children}
          {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
        </>
      )}
    </button>
  );
}

function inlineBlockDisplay(block) {
  return block ? 'flex' : 'inline-flex';
}

function getSizeStyle(size) {
  switch (size) {
    case 'xs':
      return { padding: '5px 12px', fontSize: '0.75rem' };
    case 'sm':
      return { padding: '8px 18px', fontSize: '0.82rem' };
    case 'lg':
      return { padding: '14px 32px', fontSize: '1rem' };
    case 'md':
    default:
      return { padding: '11px 24px', fontSize: '0.90rem' };
  }
}

function getVariantStyle(variant) {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: '#FFFFFF',
        color: '#181B26',
        border: '1px solid var(--border-color)',
        boxShadow: '0 2px 6px rgba(24, 27, 38, 0.04)'
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: '#181B26',
        border: '1px solid var(--border-color)'
      };
    case 'subtle':
    case 'soft':
      return {
        backgroundColor: '#FDF2F6',
        color: '#922756',
        border: '1px solid #F5D3E0'
      };
    case 'dark':
      return {
        backgroundColor: '#181B26',
        color: '#FFFFFF',
        border: '1px solid #181B26'
      };
    case 'primary':
    default:
      return {
        backgroundColor: '#922756',
        color: '#FFFFFF',
        border: '1px solid #922756',
        boxShadow: '0 3px 12px rgba(146, 39, 86, 0.22)'
      };
  }
}
