import React from 'react';

export default function ProgressRing({ percentage = 0, radius = 36, strokeWidth = 6, color = '#8b5cf6' }) {
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="progress-ring"
      >
        {/* Track circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.05)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Animated Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="progress-ring-circle"
        />
      </svg>
      {/* Centered label */}
      <span
        className="position-absolute font-display fw-bold text-white"
        style={{ fontSize: `${radius * 0.4}px`, letterSpacing: '-0.03em' }}
      >
        {Math.round(percentage)}%
      </span>
    </div>
  );
}
