import React, { useState } from 'react';
import { Award, Zap, Shield, Flame } from 'lucide-react';

interface StatsTableProps {
  stats: {
    topBatsmen: any[];
    topBowlers: any[];
    mvpList: any[];
    highestTeamScore?: any;
    lowestTeamScore?: any;
  };
}

export const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const [tab, setTab] = useState<'orange' | 'purple' | 'mvp'>('orange');

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('orange')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'orange'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" /> Orange Cap (Top Runs)
          </button>
          <button
            onClick={() => setTab('purple')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'purple'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" /> Purple Cap (Top Wickets)
          </button>
          <button
            onClick={() => setTab('mvp')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'mvp'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" /> Tournament MVP
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {tab === 'orange' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 pb-2 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Batsman</th>
                <th className="py-2.5 px-3 text-right">Runs</th>
                <th className="py-2.5 px-3 text-right">Balls</th>
                <th className="py-2.5 px-3 text-right">SR</th>
                <th className="py-2.5 px-3 text-right">4s</th>
                <th className="py-2.5 px-3 text-right">6s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {stats.topBatsmen.map((b, idx) => (
                <tr key={b.id} className="hover:bg-gray-900/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-amber-400">#{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-950/80 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
                      {b.name.charAt(0)}
                    </div>
                    {b.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">{b.runs}</td>
                  <td className="py-3 px-3 text-right text-gray-400 font-mono">{b.balls}</td>
                  <td className="py-3 px-3 text-right text-cyan-400 font-mono font-semibold">{b.strikeRate}</td>
                  <td className="py-3 px-3 text-right text-gray-300 font-mono">{b.fours}</td>
                  <td className="py-3 px-3 text-right text-amber-400 font-mono font-bold">{b.sixes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'purple' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 pb-2 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Bowler</th>
                <th className="py-2.5 px-3 text-right">Wickets</th>
                <th className="py-2.5 px-3 text-right">Overs</th>
                <th className="py-2.5 px-3 text-right">Runs</th>
                <th className="py-2.5 px-3 text-right">Econ</th>
                <th className="py-2.5 px-3 text-right">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {stats.topBowlers.map((b, idx) => (
                <tr key={b.id} className="hover:bg-gray-900/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-purple-400">#{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400">
                      {b.name.charAt(0)}
                    </div>
                    {b.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-purple-400 text-sm">{b.wickets}</td>
                  <td className="py-3 px-3 text-right text-gray-400 font-mono">{b.overs}</td>
                  <td className="py-3 px-3 text-right text-gray-300 font-mono">{b.runsConceded}</td>
                  <td className="py-3 px-3 text-right text-cyan-400 font-mono font-semibold">{b.economy}</td>
                  <td className="py-3 px-3 text-right text-gray-300 font-mono">{b.average}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'mvp' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 pb-2 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3 text-right">MVP Points</th>
                <th className="py-2.5 px-3 text-right">Runs</th>
                <th className="py-2.5 px-3 text-right">Wickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
              {stats.mvpList.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-900/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-cyan-400">#{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
                      {p.name.charAt(0)}
                    </div>
                    {p.name}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400 text-sm">{p.mvpPoints} pts</td>
                  <td className="py-3 px-3 text-right text-amber-400 font-mono">{p.runs}</td>
                  <td className="py-3 px-3 text-right text-purple-400 font-mono">{p.wickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
