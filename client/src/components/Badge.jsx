import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', icon: Icon, style = {} }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return {
          backgroundColor: '#181B26',
          color: '#FFFFFF',
          borderColor: '#181B26'
        };
      case 'available':
      case 'active':
        return {
          backgroundColor: '#ECFDF5',
          color: '#059669',
          borderColor: '#A7F3D0'
        };
      case 'occupied':
      case 'busy':
        return {
          backgroundColor: '#FDF2F6',
          color: '#922756',
          borderColor: '#F5D3E0'
        };
      case 'muted':
      case 'neutral':
        return {
          backgroundColor: '#F8FAFC',
          color: '#505A69',
          borderColor: '#E2E8F0'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#181B26',
          borderColor: 'var(--border-color)'
        };
      case 'berry':
      case 'default':
      default:
        return {
          backgroundColor: '#FDF2F6',
          color: '#922756',
          borderColor: '#F5D3E0'
        };
    }
  };

  const isSmall = size === 'xs' || size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: isSmall ? '3px 10px' : '5px 14px',
        fontSize: isSmall ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        fontFamily: 'var(--font-main)',
        textTransform: 'none',
        borderRadius: '9999px',
        border: '1px solid',
        lineHeight: 1.25,
        ...getVariantStyles(),
        ...style
      }}
    >
      {Icon && <Icon size={isSmall ? 11 : 13} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (!status) return null;
  const upper = status.toString().toUpperCase();

  let variant = 'default';
  if (upper === 'AVAILABLE' || upper === 'ACTIVE' || upper === 'VALID' || upper === 'OPEN') {
    variant = 'available';
  } else if (upper === 'OCCUPIED' || upper === 'EXPIRED' || upper === 'BUSY') {
    variant = 'occupied';
  } else if (upper === 'PREMIUM' || upper === 'PREMIUM_MEMBER') {
    variant = 'berry';
  } else {
    variant = 'neutral';
  }

  return <Badge variant={variant}>{upper.replace('_', ' ')}</Badge>;
}
