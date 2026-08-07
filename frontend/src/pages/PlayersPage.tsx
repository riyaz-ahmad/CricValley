import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, Award, User, Phone, Calendar } from 'lucide-react';
import { Player, Team } from '../types';
import { apiRequest } from '../services/api';

export const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, tData] = await Promise.all([
          apiRequest<Player[]>('/players'),
          apiRequest<Team[]>('/teams'),
        ]);
        setPlayers(pData);
        setTeams(tData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.battingStyle.toLowerCase().includes(search.toLowerCase()) ||
                          p.bowlingStyle.toLowerCase().includes(search.toLowerCase());
    const matchesRole = selectedRole === 'ALL' || p.role === selectedRole;
    const matchesTeam = selectedTeamId === 'ALL' || p.teamId === selectedTeamId;
    return matchesSearch && matchesRole && matchesTeam;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-400" /> CricValley Player Directory
            </h1>
            <p className="text-slate-400 text-sm mt-1">Browse participating players, squad roles, jersey numbers, and career styles</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search player name, style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
          >
            <option value="ALL">All Roles</option>
            <option value="BATSMAN">Batsman</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All Rounder</option>
            <option value="WICKET_KEEPER">Wicket Keeper</option>
          </select>

          {/* Team Filter */}
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
          >
            <option value="ALL">All Teams</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>{tm.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Players Directory Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Loading player directory...</div>
      ) : filteredPlayers.length === 0 ? (
        <div className="py-20 text-center text-slate-500">No players found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/20">
                    #{p.jerseyNumber || 18}
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-white text-base">{p.name}</h3>
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {p.team?.name || 'Free Agent'}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-950 text-slate-300 border border-slate-800">
                  {p.role.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Batting Style:</span>
                  <span className="font-bold text-white">{p.battingStyle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bowling Style:</span>
                  <span className="font-bold text-white">{p.bowlingStyle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
