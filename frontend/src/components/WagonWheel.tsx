import React from 'react';
import { BallEvent } from '../types';

interface WagonWheelProps {
  balls: BallEvent[];
}

export const WagonWheel: React.FC<WagonWheelProps> = ({ balls }) => {
  // Filter balls that resulted in runs (4s and 6s highlighted)
  const scoringBalls = balls.filter((b) => b.runs > 0 || b.wagonWheelZone || b.wagonWheelAngle !== null);

  const getZoneCoords = (zone?: string, angle?: number | null) => {
    let finalAngle = angle;
    if (finalAngle === undefined || finalAngle === null) {
      switch (zone) {
        case 'FINE_LEG': finalAngle = 135; break;
        case 'SQUARE_LEG': finalAngle = 90; break;
        case 'MID_WICKET': finalAngle = 45; break;
        case 'LONG_ON': finalAngle = 15; break;
        case 'LONG_OFF': finalAngle = 345; break;
        case 'COVER': finalAngle = 315; break;
        case 'POINT': finalAngle = 270; break;
        case 'THIRD_MAN': finalAngle = 225; break;
        default: finalAngle = Math.floor(Math.random() * 360);
      }
    }

    const rad = ((finalAngle - 90) * Math.PI) / 180;
    const distance = 110; // field radius
    const cx = 150;
    const cy = 150;

    return {
      x2: cx + distance * Math.cos(rad),
      y2: cy + distance * Math.sin(rad),
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 rounded-2xl">
      <h4 className="text-sm font-heading font-bold text-white mb-3 uppercase tracking-wider">
        360° Wagon Wheel Visualizer
      </h4>

      <div className="relative w-[300px] h-[300px]">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* Oval Field Outer Boundary */}
          <ellipse cx="150" cy="150" rx="135" ry="135" className="fill-emerald-950/60 stroke-emerald-500/40 stroke-2" />
          
          {/* Inner 30-Yard Circle */}
          <ellipse cx="150" cy="150" rx="65" ry="65" className="fill-none stroke-emerald-400/20 stroke-1 stroke-dasharray-4" />
          
          {/* Pitch Rect */}
          <rect x="144" y="125" width="12" height="50" rx="2" className="fill-amber-900/60 stroke-amber-700/50 stroke-1" />

          {/* Sector Guidelines */}
          <line x1="150" y1="15" x2="150" y2="285" className="stroke-white/10 stroke-1" />
          <line x1="15" y1="150" x2="285" y2="150" className="stroke-white/10 stroke-1" />
          <line x1="55" y1="55" x2="245" y2="245" className="stroke-white/10 stroke-1" />
          <line x1="245" y1="55" x2="55" y2="245" className="stroke-white/10 stroke-1" />

          {/* Zone Labels */}
          <text x="150" y="25" textAnchor="middle" className="fill-gray-400 text-[9px] font-semibold">LONG ON / OFF</text>
          <text x="275" y="153" textAnchor="middle" className="fill-gray-400 text-[9px] font-semibold">SQUARE LEG</text>
          <text x="150" y="285" textAnchor="middle" className="fill-gray-400 text-[9px] font-semibold">THIRD MAN / FINE LEG</text>
          <text x="25" y="153" textAnchor="middle" className="fill-gray-400 text-[9px] font-semibold">POINT / COVER</text>

          {/* Shot Rays */}
          {scoringBalls.map((b, idx) => {
            const { x2, y2 } = getZoneCoords(b.wagonWheelZone, b.wagonWheelAngle);
            const isFour = b.runs === 4;
            const isSix = b.runs === 6;

            const strokeColor = isSix
              ? '#F59E0B' // Amber Gold for 6
              : isFour
              ? '#06B6D4' // Cyan for 4
              : '#10B981'; // Green for singles

            return (
              <g key={b.id || idx}>
                <line
                  x1="150"
                  y1="150"
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={isSix ? '3' : isFour ? '2' : '1'}
                  opacity={0.85}
                  strokeDasharray={isSix ? 'none' : isFour ? 'none' : '2,2'}
                />
                <circle cx={x2} cy={y2} r={isSix ? '4' : '3'} fill={strokeColor} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 1-3 Runs
        </span>
        <span className="flex items-center gap-1 text-cyan-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span> 4 Runs
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 6 Runs
        </span>
      </div>
    </div>
  );
};
