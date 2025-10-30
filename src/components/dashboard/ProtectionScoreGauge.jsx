import React from "react";

export default function ProtectionScoreGauge({ score = 0, size = 180 }) {
  // Color segments based on score ranges
  const getSegmentColor = (segmentStart, segmentEnd) => {
    if (score >= segmentStart) {
      if (segmentEnd <= 25) return '#EF4444'; // Red - Poor
      if (segmentEnd <= 50) return '#F59E0B'; // Orange - Fair
      if (segmentEnd <= 70) return '#EAB308'; // Yellow - Good
      return '#10B981'; // Green - Excellent
    }
    return '#E5E7EB'; // Gray - inactive
  };

  const getStatusLabel = (score) => {
    if (score >= 85) return { text: 'Excellent', color: '#10B981' };
    if (score >= 70) return { text: 'Good', color: '#EAB308' };
    if (score >= 50) return { text: 'Fair', color: '#F59E0B' };
    return { text: 'Needs Work', color: '#EF4444' };
  };

  const status = getStatusLabel(score);
  const radius = (size - 40) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeWidth = 24;
  const center = size / 2;

  // Create segments for the gauge
  const segments = [
    { start: 0, end: 25, color: '#EF4444' },    // Red
    { start: 25, end: 50, color: '#F59E0B' },   // Orange
    { start: 50, end: 70, color: '#EAB308' },   // Yellow
    { start: 70, end: 100, color: '#10B981' },  // Green
  ];

  return (
    <div style={{ 
      position: 'relative', 
      width: `${size}px`, 
      height: `${size * 0.65}px`,
      margin: '0 auto'
    }}>
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        style={{ overflow: 'visible' }}
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored segments based on score */}
        {segments.map((segment, idx) => {
          const isActive = score >= segment.start;
          const segmentScore = Math.min(score, segment.end);
          const segmentLength = segment.end - segment.start;
          const progress = isActive ? Math.min((segmentScore - segment.start) / segmentLength, 1) : 0;
          const segmentCircumference = (circumference * segmentLength) / 100;
          const offset = (circumference * segment.start) / 100;

          return (
            <path
              key={idx}
              d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
              fill="none"
              stroke={isActive ? segment.color : '#E5E7EB'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${segmentCircumference * progress} ${circumference}`}
              strokeDashoffset={-offset}
              style={{
                transition: 'stroke-dasharray 1s ease-out, stroke 0.3s ease',
              }}
            />
          );
        })}

        {/* Tick marks */}
        {[0, 25, 50, 70, 85, 100].map((tick) => {
          const angle = (tick / 100) * Math.PI - Math.PI;
          const x1 = center + (radius - strokeWidth / 2 - 5) * Math.cos(angle);
          const y1 = center + (radius - strokeWidth / 2 - 5) * Math.sin(angle);
          const x2 = center + (radius - strokeWidth / 2 + 5) * Math.cos(angle);
          const y2 = center + (radius - strokeWidth / 2 + 5) * Math.sin(angle);

          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#374151"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Center circle with score */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        marginTop: '-8px'
      }}>
        <div style={{
          width: `${size * 0.45}px`,
          height: `${size * 0.45}px`,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '6px solid #1A1D1F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: `${size * 0.22}px`,
            fontWeight: 'bold',
            color: '#1A1D1F',
            lineHeight: '1',
            marginBottom: '4px'
          }}>
            {score}%
          </div>
          <div style={{
            fontSize: `${size * 0.07}px`,
            fontWeight: '600',
            color: status.color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {status.text}
          </div>
        </div>
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '10px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#EF4444'
      }}>
        POOR
      </div>
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        right: '10px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#10B981'
      }}>
        GOOD
      </div>
    </div>
  );
}