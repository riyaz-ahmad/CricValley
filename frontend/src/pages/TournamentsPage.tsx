import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Search, Filter, Calendar, MapPin, Shield } from 'lucide-react';
import { Tournament } from '../types';
import { apiRequest } from '../services/api';

export const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        let url = `/tournaments?search=${encodeURIComponent(search)}`;
        if (formatFilter) url += `&format=${formatFilter}`;
        const data = await apiRequest<Tournament[]>(url);
        setTournaments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [search, formatFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 border border-gray-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" /> Cricket Tournaments
          </h1>
          <p className="text-gray-400 text-sm mt-1">Browse active, upcoming, and archived cricket leagues</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Formats</option>
            <option value="LEAGUE">League</option>
            <option value="KNOCKOUT">Knockout</option>
            <option value="LEAGUE_KNOCKOUT">League + Knockout</option>
            <option value="ROUND_ROBIN">Round Robin</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 animate-pulse">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No tournaments match your search criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
                    {t.format.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400 font-mono font-semibold">{t.overs} Overs</span>
                </div>

                <h3 className="text-xl font-heading font-bold text-white hover:text-cyan-400 transition-colors">
                  <Link to={`/tournaments/${t.id}`}>{t.title}</Link>
                </h3>

                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{t.description}</p>

                <div className="space-y-1.5 text-xs text-gray-400 pt-2 border-t border-gray-800/80">
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {t.ground || 'Main Stadium'}, {t.city}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> {new Date(t.startDate).toLocaleDateString()} to {new Date(t.endDate).toLocaleDateString()}</div>
                  {t.prizePool && <div className="flex items-center gap-2 text-amber-400 font-semibold"><Trophy className="w-3.5 h-3.5" /> Prize: {t.prizePool}</div>}
                </div>
              </div>

              <div className="bg-gray-950 px-6 py-4 border-t border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1.5"><Shield className="w-4 h-4 text-cyan-400" /> {t._count?.teams || 4} Teams</span>
                <Link
                  to={`/tournaments/${t.id}`}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
