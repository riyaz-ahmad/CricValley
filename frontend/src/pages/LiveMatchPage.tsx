import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, CheckCircle2, Activity, ArrowLeft, Award, Flame, Circle } from 'lucide-react';
import { Match } from '../types';
import { apiRequest } from '../services/api';
import { storage } from '../services/storage';
import { BallTracker } from '../components/BallTracker';

export const LiveMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const res = await apiRequest<Match>(`/matches/${id}`);
      setMatch(res);
    } catch (err) {
      const allMatches = storage.getMatches();
      const found = allMatches.find((m) => m.id === id) || null;
      setMatch(found);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !match) {
    return <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Loading live match scoreboard...</div>;
  }

  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const activeInnings = (inn2 && !inn2.isCompleted ? inn2 : inn1) || inn1;

  const getStageTag = (stage: string) => {
    switch (stage) {
      case 'FINAL':
        return { label: '🔥 FINAL MATCH', bg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black' };
      case 'SEMI_FINAL':
        return { label: '⚡ SEMI-FINAL', bg: 'bg-purple-950 text-purple-300 border border-purple-700 font-extrabold' };
      case 'QUARTER_FINAL':
        return { label: '🎯 QUARTER-FINAL', bg: 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' };
      default:
        return { label: 'GROUP STAGE MATCH', bg: 'bg-slate-800 text-slate-300 font-semibold' };
    }
  };

  const tag = getStageTag(match.stage);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to All Matches
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded text-xs uppercase ${tag.bg}`}>
              {tag.label}
            </span>
            <span className="text-slate-400 font-semibold">{match.tournament?.title || 'CricValley Tournament'} • Match #{match.matchNumber}</span>
          </div>
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
              match.status === 'LIVE'
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : match.status === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {match.status === 'LIVE' && <Circle className="w-2.5 h-2.5 fill-current text-red-600" />}
            {match.status === 'LIVE' ? 'LIVE ONGOING' : match.status}
          </span>
        </div>

        {/* Live Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={`border p-6 rounded-2xl space-y-2 text-center transition-all ${
            activeInnings?.battingTeamId === match.homeTeamId
              ? 'bg-gradient-to-b from-slate-950 to-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center mx-auto text-sm border border-emerald-800">
              {match.homeTeam.shortName}
            </div>
            <div className="font-heading font-extrabold text-white text-lg">{match.homeTeam.name}</div>
            <div className="text-4xl font-mono font-black text-emerald-400">
              {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono font-semibold">
              {inn1 ? `${inn1.overs} Overs` : 'Yet to Bat'}
            </div>
          </div>

          <div className={`border p-6 rounded-2xl space-y-2 text-center transition-all ${
            activeInnings?.battingTeamId === match.awayTeamId
              ? 'bg-gradient-to-b from-slate-950 to-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center mx-auto text-sm border border-emerald-800">
              {match.awayTeam.shortName}
            </div>
            <div className="font-heading font-extrabold text-white text-lg">{match.awayTeam.name}</div>
            <div className="text-4xl font-mono font-black text-emerald-400">
              {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono font-semibold">
              {inn2 ? `${inn2.overs} Overs` : 'Yet to Bat'}
            </div>
          </div>
        </div>

        {/* Live Over Ball Tracker */}
        {activeInnings && activeInnings.balls && activeInnings.balls.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-300 font-bold uppercase">This Over Ball-by-Ball:</div>
            <BallTracker balls={activeInnings.balls.slice(-6)} />
          </div>
        )}

        {/* Ball Commentary Timeline */}
        {activeInnings && activeInnings.balls && activeInnings.balls.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Ball Commentary</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[...activeInnings.balls].reverse().slice(0, 10).map((b, idx) => (
                <div key={b.id || idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 font-bold">{b.overNumber}.{b.ballNumberInOver}</span>
                    <span className="text-slate-200">{b.commentary}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                    b.isWicket ? 'bg-red-600 text-white' : b.runs === 6 ? 'bg-amber-500 text-slate-950' : b.runs === 4 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {b.isWicket ? 'OUT' : `${b.runs} RUNS`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Summary */}
        {match.resultSummary && (
          <div className="bg-gradient-to-r from-amber-950 to-orange-950 border border-amber-800/60 p-5 rounded-2xl text-center space-y-1">
            <div className="text-xs text-amber-400 uppercase font-bold tracking-wider">Official Match Result</div>
            <div className="text-xl font-heading font-black text-amber-300">🏆 {match.resultSummary}</div>
          </div>
        )}

        {/* Man of the Match Badge */}
        {match.playerOfTheMatch && (
          <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-800/60 p-5 rounded-2xl text-center space-y-1">
            <div className="text-xs text-emerald-400 uppercase font-black tracking-wider flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" /> Player of the Match Award
            </div>
            <div className="text-xl font-heading font-black text-white">{match.playerOfTheMatch.name}</div>
            <div className="text-xs text-slate-400 font-medium">{match.playerOfTheMatch.role.replace('_', ' ')} • #{match.playerOfTheMatch.jerseyNumber}</div>
          </div>
        )}

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div>Venue: <strong className="text-white">{match.venue || 'Stadium'}</strong></div>
          <div>Scheduled: <strong className="text-white">{new Date(match.scheduledAt).toLocaleString()}</strong></div>
        </div>
      </div>
    </div>
  );
};
