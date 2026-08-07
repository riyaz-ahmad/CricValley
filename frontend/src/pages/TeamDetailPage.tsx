import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Users, Trophy, Calendar, UserCheck } from 'lucide-react';
import { Team } from '../types';
import { apiRequest } from '../services/api';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id) return;
      try {
        const res = await apiRequest<Team>(`/teams/${id}`);
        setTeam(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  if (loading || !team) {
    return <div className="py-20 text-center text-gray-400 animate-pulse">Loading team profile...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-cyan-950 border-2 border-cyan-500/40 flex items-center justify-center font-black text-cyan-400 text-3xl shadow-xl shrink-0">
          {team.shortName}
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <h1 className="text-3xl font-heading font-black text-white">{team.name}</h1>
          <p className="text-sm text-gray-400">Franchise Based in {team.city || 'City'}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs pt-2">
            <span className="bg-gray-950 px-3 py-1 rounded-lg border border-gray-800 text-gray-300">Captain: <strong className="text-white">{team.captainName || 'N/A'}</strong></span>
            <span className="bg-gray-950 px-3 py-1 rounded-lg border border-gray-800 text-gray-300">Coach: <strong className="text-white">{team.coachName || 'N/A'}</strong></span>
          </div>
        </div>
      </div>

      {/* Squad Players */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" /> Team Squad ({team.players?.length || 0})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {team.players?.map((player) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="bg-gray-900/60 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-950 border border-gray-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                  #{player.jerseyNumber || '-'}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm group-hover:text-cyan-400 transition-colors">
                    {player.name}
                  </div>
                  <div className="text-xs text-gray-400">{player.role.replace('_', ' ')}</div>
                </div>
              </div>

              <div className="text-xs text-gray-400 font-mono">
                {player.battingStyle.split('-')[0]}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
