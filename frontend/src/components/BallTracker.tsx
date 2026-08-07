import React from 'react';
import { BallEvent } from '../types';

interface BallTrackerProps {
  balls: BallEvent[];
}

export const BallTracker: React.FC<BallTrackerProps> = ({ balls }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
      {balls.map((b, idx) => {
        let label = `${b.runs}`;
        let bgClass = 'bg-gray-800 text-gray-200 border-gray-700';

        if (b.isWicket) {
          label = 'W';
          bgClass = 'bg-red-600 text-white font-black border-red-500 shadow-md shadow-red-500/30';
        } else if (b.extraType === 'WIDE') {
          label = `Wd+${b.runs}`;
          bgClass = 'bg-amber-950 text-amber-300 border-amber-800';
        } else if (b.extraType === 'NO_BALL') {
          label = `Nb+${b.runs}`;
          bgClass = 'bg-orange-950 text-orange-300 border-orange-800';
        } else if (b.runs === 6) {
          label = '6';
          bgClass = 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-gray-950 font-extrabold border-amber-300 shadow-md shadow-amber-500/20';
        } else if (b.runs === 4) {
          label = '4';
          bgClass = 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white font-bold border-cyan-400 shadow-md shadow-cyan-500/20';
        } else if (b.runs === 0) {
          label = '•';
          bgClass = 'bg-gray-900 text-gray-400 border-gray-800';
        }

        return (
          <div
            key={b.id || idx}
            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 transition-transform hover:scale-110 ${bgClass}`}
            title={b.commentary || `${label} runs`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};
