import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Trophy, Shield, Users, Calendar } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Tournament, Team, Player, Match } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
    matches: Match[];
  }>({ tournaments: [], teams: [], players: [], matches: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tournaments: [], teams: [], players: [], matches: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiRequest<any>(`/extra/search?q=${encodeURIComponent(query)}`);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search tournaments, teams, players, matches..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
              Searching database...
            </div>
          )}

          {!loading && query && results.tournaments.length === 0 && results.teams.length === 0 && results.players.length === 0 && results.matches.length === 0 && (
            <div className="py-8 text-center text-gray-400 text-sm">
              No matching records found for "{query}"
            </div>
          )}

          {/* Tournaments */}
          {results.tournaments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold-400" /> Tournaments
              </h4>
              <div className="space-y-1">
                {results.tournaments.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/tournaments/${t.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-800/80 flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-white">{t.title}</span>
                    <span className="text-xs text-gray-400">{t.city} • {t.format}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          {results.teams.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> Teams
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {results.teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/teams/${t.id}`)}
                    className="text-left p-2.5 rounded-lg hover:bg-gray-800/80 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-950 flex items-center justify-center font-bold text-cyan-400 text-xs">
                      {t.shortName}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.city || 'Franchise'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Players */}
          {results.players.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Players
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {results.players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/players/${p.id}`)}
                    className="text-left p-2.5 rounded-lg hover:bg-gray-800/80 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.role.replace('_', ' ')} • {p.team?.shortName || 'Free Agent'}</div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">
                      #{p.jerseyNumber || '-'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matches */}
          {results.matches.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Matches
              </h4>
              <div className="space-y-1">
                {results.matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(`/matches/${m.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-gray-800/80 flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-white text-sm">
                      {m.homeTeam.name} vs {m.awayTeam.name}
                    </span>
                    <span className="text-xs text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded">
                      {m.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
