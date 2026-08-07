import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { FormattedInnings } from '../types';

interface ScoreWormChartProps {
  inningsList: FormattedInnings[];
  maxOvers?: number;
}

export const ScoreWormChart: React.FC<ScoreWormChartProps> = ({ inningsList, maxOvers = 20 }) => {
  const inn1 = inningsList.find((i) => i.inningNumber === 1);
  const inn2 = inningsList.find((i) => i.inningNumber === 2);

  // Generate dataset per over
  const chartData = [];
  for (let over = 1; over <= maxOvers; over++) {
    const inn1Over = inn1?.scoreWormData?.find((d) => d.over === over);
    const inn2Over = inn2?.scoreWormData?.find((d) => d.over === over);

    chartData.push({
      over: `Ov ${over}`,
      [inn1?.battingTeam?.shortName || 'Innings 1']: inn1Over ? inn1Over.runs : null,
      [inn2?.battingTeam?.shortName || 'Innings 2']: inn2Over ? inn2Over.runs : null,
    });
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 shadow-lg">
      <h4 className="text-sm font-heading font-bold text-white mb-4 uppercase tracking-wider flex items-center justify-between">
        <span>Score Worm (Cumulative Run Progress)</span>
        <span className="text-xs font-mono text-cyan-400 font-normal">Over 1 to {maxOvers}</span>
      </h4>

      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="over" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            {inn1 && (
              <Line
                type="monotone"
                dataKey={inn1.battingTeam?.shortName || 'Innings 1'}
                stroke="#06B6D4"
                strokeWidth={3}
                dot={{ r: 3, fill: '#06B6D4' }}
                activeDot={{ r: 6 }}
              />
            )}
            {inn2 && (
              <Line
                type="monotone"
                dataKey={inn2.battingTeam?.shortName || 'Innings 2'}
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ r: 3, fill: '#F59E0B' }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
