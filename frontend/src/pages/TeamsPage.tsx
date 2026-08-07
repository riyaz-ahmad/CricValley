import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Users, Trophy } from 'lucide-react';
import { Team } from '../types';
import { apiRequest } from '../services/api';

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<Team[]>(`/teams?search=${encodeURIComponent(search)}`);
        setTeams(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 border border-gray-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" /> Participating Teams
          </h1>
          <p className="text-gray-400 text-sm mt-1">Explore team squads, captains, coaches, and statistics</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search teams by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {teams.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-2xl p-6 shadow-xl transition-all space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3 text-center">
              <div className="w-20 h-20 rounded-full bg-cyan-950 border-2 border-cyan-500/40 mx-auto flex items-center justify-center font-black text-cyan-400 text-2xl group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/10">
                {team.shortName}
              </div>
              <h3 className="text-xl font-heading font-bold text-white group-hover:text-cyan-400 transition-colors">
                {team.name}
              </h3>
              <div className="text-xs text-gray-400 font-semibold">{team.city || 'Franchise'}</div>
            </div>

            <div className="border-t border-gray-800/80 pt-3 space-y-1 text-xs text-gray-400">
              <div className="flex justify-between"><span>Captain:</span> <span className="text-white font-semibold">{team.captainName || 'TBD'}</span></div>
              <div className="flex justify-between"><span>Coach:</span> <span className="text-gray-300">{team.coachName || 'TBD'}</span></div>
              <div className="flex justify-between"><span>Squad Size:</span> <span className="text-cyan-400 font-mono font-bold">{team._count?.players || 0} players</span></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
