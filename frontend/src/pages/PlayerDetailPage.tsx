import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Award, Flame, Zap, Shield, Phone, Calendar } from 'lucide-react';
import { Player } from '../types';
import { apiRequest } from '../services/api';

export const PlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!id) return;
      try {
        const data = await apiRequest<Player>(`/players/${id}`);
        setPlayer(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  if (loading || !player) {
    return <div className="py-20 text-center text-gray-400 animate-pulse">Loading player profile...</div>;
  }

  const stats = player.careerStats;

  return (
    <div className="space-y-8">
      {/* Player Card Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8">
        <div className="w-28 h-28 rounded-2xl bg-cyan-950 border-2 border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 text-4xl shadow-xl shrink-0">
          #{player.jerseyNumber || '?'}
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-0.5 rounded-full">
              {player.role.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-400 font-semibold">{player.team?.name || 'Free Agent'}</span>
          </div>

          <h1 className="text-3xl font-heading font-black text-white">{player.name}</h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-300 pt-2">
            <span>Batting: <strong className="text-white">{player.battingStyle}</strong></span>
            <span>•</span>
            <span>Bowling: <strong className="text-white">{player.bowlingStyle}</strong></span>
          </div>
        </div>

        {stats && (
          <div className="bg-gray-950/80 border border-gray-800 p-4 rounded-2xl text-center flex items-center gap-6">
            <div>
              <div className="text-2xl font-bold font-mono text-amber-400">{stats.playerOfMatchCount}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">M.O.M Awards</div>
            </div>
          </div>
        )}
      </div>

      {/* Career Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Batting Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-heading font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Flame className="w-5 h-5 text-amber-400" /> Batting Career Statistics
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-xl font-mono font-bold text-amber-400">{stats.totalRuns}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Total Runs</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-xl font-mono font-bold text-cyan-400">{stats.strikeRate}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Strike Rate</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-xl font-mono font-bold text-emerald-400">{stats.battingAvg}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Average</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-lg font-mono font-bold text-white">{stats.ballsFaced}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Balls Faced</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-lg font-mono font-bold text-cyan-400">{stats.fours}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Fours (4s)</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-lg font-mono font-bold text-amber-400">{stats.sixes}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Sixes (6s)</div>
              </div>
            </div>
          </div>

          {/* Bowling Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-heading font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Zap className="w-5 h-5 text-purple-400" /> Bowling Career Statistics
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-xl font-mono font-bold text-purple-400">{stats.totalWickets}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Wickets</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-xl font-mono font-bold text-cyan-400">{stats.economy}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Economy</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-xl font-mono font-bold text-emerald-400">{stats.bowlingAvg}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Average</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <div className="text-lg font-mono font-bold text-white">{stats.oversBowled}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Overs Bowled</div>
              </div>

              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 col-span-2">
                <div className="text-lg font-mono font-bold text-gray-300">{stats.runsConceded}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Runs Conceded</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
