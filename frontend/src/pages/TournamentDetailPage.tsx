import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Shield, Calendar, Award, Image, Megaphone, FileText, MapPin, DollarSign, Activity } from 'lucide-react';
import { Tournament, TournamentTeam, Match } from '../types';
import { apiRequest } from '../services/api';
import { KnockoutBracket } from '../components/KnockoutBracket';
import { StatsTable } from '../components/StatsTable';

export const TournamentDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'fixtures' | 'points' | 'bracket' | 'stats' | 'announcements' | 'gallery'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!identifier) return;
      try {
        const t = await apiRequest<Tournament>(`/tournaments/${identifier}`);
        setTournament(t);

        const s = await apiRequest<any>(`/stats/${t.id}`);
        setStats(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [identifier]);

  if (loading || !tournament) {
    return <div className="py-20 text-center text-gray-400 animate-pulse">Loading tournament hub...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Banner Header */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-800 bg-gray-900 shadow-2xl">
        <div
          className="h-48 sm:h-64 bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${tournament.bannerUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80'})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"></div>
        </div>

        <div className="relative p-6 sm:p-8 -mt-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-950 border-2 border-cyan-500/40 p-2 shadow-2xl shrink-0 overflow-hidden">
              <img
                src={tournament.logoUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80'}
                alt={tournament.title}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 border border-cyan-800 px-2.5 py-0.5 rounded-full">
                  {tournament.format.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400 font-mono">{tournament.overs} Overs T20</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white mt-1">{tournament.title}</h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {tournament.ground || 'Stadium'}, {tournament.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
            <div className="bg-gray-950/80 border border-gray-800 px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Prize Pool</div>
              <div className="text-sm font-bold text-amber-400">{tournament.prizePool || '$50,000'}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-t border-gray-800 flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'teams', label: `Teams (${tournament.teams?.length || 0})`, icon: Shield },
            { id: 'fixtures', label: `Fixtures (${tournament.matches?.length || 0})`, icon: Calendar },
            { id: 'points', label: 'Points Table (NRR)', icon: Trophy },
            { id: 'bracket', label: 'Knockout Bracket', icon: Activity },
            { id: 'stats', label: 'Statistics', icon: Award },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'gallery', label: 'Gallery', icon: Image },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 shadow-md shadow-cyan-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white">About the Tournament</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{tournament.description}</p>
              </div>

              {tournament.rules && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-heading font-bold text-white">Tournament Rules & Regulations</h3>
                  <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">{tournament.rules}</div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">Tournament Details</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-800"><span className="text-gray-400">Format</span> <span className="text-white font-semibold">{tournament.format}</span></div>
                  <div className="flex justify-between py-1 border-b border-gray-800"><span className="text-gray-400">Match Overs</span> <span className="text-white font-semibold">{tournament.overs} overs</span></div>
                  <div className="flex justify-between py-1 border-b border-gray-800"><span className="text-gray-400">Ball Type</span> <span className="text-white font-semibold">{tournament.ballType}</span></div>
                  <div className="flex justify-between py-1 border-b border-gray-800"><span className="text-gray-400">Entry Fee</span> <span className="text-white font-semibold">${tournament.entryFee}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {tournament.teams?.map((tt) => (
              <Link
                key={tt.id}
                to={`/teams/${tt.team.id}`}
                className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-2xl p-5 text-center space-y-3 group transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-800 mx-auto flex items-center justify-center font-bold text-cyan-400 text-lg group-hover:scale-105 transition-transform">
                  {tt.team.shortName}
                </div>
                <div className="font-heading font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                  {tt.team.name}
                </div>
                <div className="text-xs text-gray-400">
                  Capt: {tt.team.captainName || 'N/A'}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* POINTS TABLE TAB */}
        {activeTab === 'points' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
            <h3 className="text-lg font-heading font-bold text-white mb-4 flex items-center justify-between">
              <span>League Points Table & Net Run Rate (NRR)</span>
              <span className="text-xs text-gray-400 font-mono">Top 2 Teams Qualify</span>
            </h3>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 pb-2 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3 text-center">P</th>
                  <th className="py-2.5 px-3 text-center">W</th>
                  <th className="py-2.5 px-3 text-center">L</th>
                  <th className="py-2.5 px-3 text-center">T</th>
                  <th className="py-2.5 px-3 text-right">Pts</th>
                  <th className="py-2.5 px-3 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {tournament.teams?.map((tt, idx) => (
                  <tr key={tt.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-cyan-400">#{idx + 1}</td>
                    <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                        {tt.team.shortName}
                      </span>
                      {tt.team.name}
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-300 font-mono">{tt.matchesPlayed}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-400 font-mono font-bold">{tt.wins}</td>
                    <td className="py-3.5 px-3 text-center text-red-400 font-mono">{tt.losses}</td>
                    <td className="py-3.5 px-3 text-center text-gray-400 font-mono">{tt.ties}</td>
                    <td className="py-3.5 px-3 text-right text-amber-400 font-mono font-bold text-sm">{tt.points}</td>
                    <td className={`py-3.5 px-3 text-right font-mono font-bold ${tt.netRunRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tt.netRunRate > 0 ? `+${tt.netRunRate}` : tt.netRunRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* KNOCKOUT BRACKET TAB */}
        {activeTab === 'bracket' && (
          <KnockoutBracket matches={tournament.matches || []} />
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && stats && (
          <StatsTable stats={stats} />
        )}
      </div>
    </div>
  );
};
