import React from 'react';

/**
 * EditorialGraphic
 * Exact flow field of directional tick marks inspired by Arlen McCluskey's portfolio.
 * 8 columns x 12 rows of dashes rotating smoothly from horizontal (0°) to vertical (90°).
 */
export default function EditorialGraphic({ 
  width = 260, 
  height = 310, 
  className = '', 
  style = {},
  color = '#171717',
  opacity = 0.55 
}) {
  const cols = 8;
  const rows = 12;
  const colSpacing = 28;
  const rowSpacing = 24;
  const length = 12;

  // Angles for each row smoothly interpolating from 0 to 90 degrees
  const rowAngles = [
    0, 2, 6, 14, 26, 42, 58, 72, 84, 88, 90, 90
  ];

  const ticks = [];
  for (let r = 0; r < rows; r++) {
    const angleDeg = rowAngles[r];
    for (let c = 0; c < cols; c++) {
      // Subtle column phase tilt for fluid flow
      const colPhase = (c - 3.5) * 1.4;
      const rad = ((angleDeg + colPhase) * Math.PI) / 180;
      const cx = 16 + c * colSpacing;
      const cy = 16 + r * rowSpacing;
      const x1 = cx - (length / 2) * Math.cos(rad);
      const y1 = cy - (length / 2) * Math.sin(rad);
      const x2 = cx + (length / 2) * Math.cos(rad);
      const y2 = cy + (length / 2) * Math.sin(rad);

      ticks.push({
        id: `${r}-${c}`,
        x1, y1, x2, y2
      });
    }
  }

  const svgWidth = 16 + (cols - 1) * colSpacing + 16;
  const svgHeight = 16 + (rows - 1) * rowSpacing + 16;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        opacity,
        ...style
      }}
      aria-hidden="true"
    >
      {ticks.map((tick) => (
        <line
          key={tick.id}
          x1={tick.x1.toFixed(2)}
          y1={tick.y1.toFixed(2)}
          x2={tick.x2.toFixed(2)}
          y2={tick.y2.toFixed(2)}
          stroke={color}
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
