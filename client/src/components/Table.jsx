import React from 'react';

export function Table({ children, style = {} }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.86rem',
          textAlign: 'left',
          ...style
        }}
      >
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
      {children}
    </thead>
  );
}

export function Tbody({ children }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, onClick, style = {} }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #ECECEA',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color var(--transition-fast)',
        ...style
      }}
      className="table-row-hover"
    >
      {children}
    </tr>
  );
}

export function Th({ children, style = {} }) {
  return (
    <th
      style={{
        padding: '12px 16px',
        fontWeight: 600,
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-secondary)',
        ...style
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, style = {} }) {
  return (
    <td
      style={{
        padding: '14px 16px',
        color: 'var(--text-primary)',
        ...style
      }}
    >
      {children}
    </td>
  );
}
