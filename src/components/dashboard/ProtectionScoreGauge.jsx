import React from "react";

export default function ProtectionScoreGauge({ score = 0, size = 260 }) {
  const getStatusLabel = (score) => {
    if (score >= 85) return { text: 'Excellent', color: '#10B981' };
    if (score >= 70) return { text: 'Good', color: '#EAB308' };
    if (score >= 50) return { text: 'Fair', color: '#F59E0B' };
    return { text: 'Poor', color: '#EF4444' };
  };

  const status = getStatusLabel(score);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const strokeWidth = size * 0.12;
  
  // Define color segments
  const segments = [
    { start: 0, end: 50, color: '#EF4444', label: 'LOW' },     // Red: 0-50
    { start: 50, end: 70, color: '#F59E0B', label: '' },        // Orange: 50-70
    { start: 70, end: 85, color: '#EAB308', label: '' },        // Yellow: 70-85
    { start: 85, end: 100, color: '#10B981', label: 'HIGH' }    // Green: 85-100
  ];

  return (
    <div style={{ 
      position: 'relative', 
      width: `${size}px`, 
      height: `${size * 0.7}px`,
      margin: '0 auto'
    }}>
      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.7}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Define gradients for smooth transitions */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="33%" stopColor="#F59E0B" />
            <stop offset="66%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* Background arc (gray) */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored segments */}
        {segments.map((segment, idx) => {
          const startAngle = -180 + (segment.start / 100) * 180;
          const endAngle = -180 + (segment.end / 100) * 180;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startRad);
          const y1 = centerY + radius * Math.sin(startRad);
          const x2 = centerX + radius * Math.cos(endRad);
          const y2 = centerY + radius * Math.sin(endRad);
          
          const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
          
          // Only show segment if score has reached it
          const isActive = score >= segment.start;
          const segmentScore = Math.min(score, segment.end);
          const progress = isActive ? (segmentScore - segment.start) / (segment.end - segment.start) : 0;
          
          if (progress === 0) return null;
          
          const partialEndAngle = startAngle + (endAngle - startAngle) * progress;
          const partialEndRad = (partialEndAngle * Math.PI) / 180;
          const x2Partial = centerX + radius * Math.cos(partialEndRad);
          const y2Partial = centerY + radius * Math.sin(partialEndRad);
          
          return (
            <path
              key={idx}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2Partial} ${y2Partial}`}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                transition: 'all 1s ease-out'
              }}
            />
          );
        })}
      </svg>

      {/* Center display with white background circle */}
      <div style={{
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        width: `${size * 0.38}px`,
        height: `${size * 0.38}px`,
        backgroundColor: '#FFFFFF',
        borderRadius: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '3px solid #F3F4F6',
        zIndex: 10
      }}>
        <div style={{
          fontSize: `${size * 0.16}px`,
          fontWeight: 'bold',
          color: '#1A1D1F',
          lineHeight: '1'
        }}>
          {score}%
        </div>
        <div style={{
          fontSize: `${size * 0.045}px`,
          fontWeight: '600',
          color: status.color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginTop: '2px'
        }}>
          {status.text}
        </div>
      </div>

      {/* LOW label (left) */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: `${size * 0.12}px`,
        fontSize: `${size * 0.055}px`,
        fontWeight: 'bold',
        color: '#EF4444',
        textTransform: 'uppercase'
      }}>
        LOW
      </div>

      {/* HIGH label (right) */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: `${size * 0.12}px`,
        fontSize: `${size * 0.055}px`,
        fontWeight: 'bold',
        color: '#10B981',
        textTransform: 'uppercase'
      }}>
        HIGH
      </div>
    </div>
  );
}