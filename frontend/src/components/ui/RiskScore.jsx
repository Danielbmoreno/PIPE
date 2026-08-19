import React from 'react';

const getColor = (score) => {
  if (score >= 80) return '#b91c1c';
  if (score >= 60) return '#ea580c';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
};

const RiskScore = ({ score = 0, size = 64 }) => {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const color = getColor(pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.08" />
        </filter>
      </defs>
      <g transform={`translate(${size / 2}, ${size / 2})`} filter="url(#soft)">
        <circle r={r} fill="#f3f7ff" />
        <circle r={r} fill="transparent" stroke="#eef3ff" strokeWidth="8" />
        <circle r={r} fill="transparent" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={offset} transform={`rotate(-90)`} />
        <text x="0" y="4" textAnchor="middle" fontSize="14" fontWeight="700" fill="#102a43">{pct}%</text>
      </g>
    </svg>
  );
};

export default RiskScore;
