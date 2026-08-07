import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types';
import { apiRequest } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Activity, Circle } from 'lucide-react';

export const LiveTicker: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const { socket } = useSocket();

  const fetchLiveMatches = async () => {
    try {
      const data = await apiRequest<Match[]>('/matches?status=LIVE');
      setLiveMatches(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchLiveMatches();
    socket.on('match_updated', handleUpdate);
    socket.on('match_status_changed', handleUpdate);
    return () => {
      socket.off('match_updated', handleUpdate);
      socket.off('match_status_changed', handleUpdate);
    };
  }, [socket]);

  if (liveMatches.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-gray-900 to-cyan-950 border-b border-red-500/30 text-white text-xs font-medium py-2 px-4 shadow-lg overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] animate-pulse">
          <Circle className="w-2 h-2 fill-current" />
          Live Matches ({liveMatches.length})
        </div>

        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 whitespace-nowrap">
          {liveMatches.map((m) => {
            const inn1 = m.innings?.find((i) => i.inningNumber === 1);
            const inn2 = m.innings?.find((i) => i.inningNumber === 2);
            return (
              <Link
                key={m.id}
                to={`/matches/${m.id}`}
                className="flex items-center gap-2 hover:text-cyan-400 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg border border-white/10"
              >
                <span className="font-semibold">{m.homeTeam.shortName}</span>
                <span className="text-gray-400">vs</span>
                <span className="font-semibold">{m.awayTeam.shortName}</span>
                <span className="text-cyan-400 font-mono font-bold bg-cyan-950/60 px-2 py-0.5 rounded">
                  {inn2 ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.overs} ov)` : inn1 ? `${inn1.totalRuns}/${inn1.wickets} (${inn1.overs} ov)` : 'Toss Completed'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
