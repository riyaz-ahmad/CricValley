import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, CheckCircle2, Activity, ArrowLeft, Award } from 'lucide-react';
import { Match } from '../types';
import { apiRequest } from '../services/api';

export const LiveMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) return;
      try {
        const res = await apiRequest<Match>(`/matches/${id}`);
        setMatch(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  if (loading || !match) {
    return <div className="py-20 text-center text-slate-400 animate-pulse">Loading match details...</div>;
  }

  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);

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
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded text-xs uppercase ${tag.bg}`}>
              {tag.label}
            </span>
            <span className="text-slate-400 font-semibold">{match.tournament?.title} • Match #{match.matchNumber}</span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              match.status === 'LIVE'
                ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
                : match.status === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {match.status === 'LIVE' ? 'ONGOING' : match.status}
          </span>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center mx-auto text-sm border border-emerald-800">
              {match.homeTeam.shortName}
            </div>
            <div className="font-heading font-extrabold text-white text-lg">{match.homeTeam.name}</div>
            <div className="text-3xl font-mono font-black text-emerald-400">
              {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono">{inn1 ? `${inn1.overs} Overs` : 'Yet to Bat'}</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center mx-auto text-sm border border-emerald-800">
              {match.awayTeam.shortName}
            </div>
            <div className="font-heading font-extrabold text-white text-lg">{match.awayTeam.name}</div>
            <div className="text-3xl font-mono font-black text-emerald-400">
              {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono">{inn2 ? `${inn2.overs} Overs` : 'Yet to Bat'}</div>
          </div>
        </div>

        {/* Result Badge */}
        {match.resultSummary && (
          <div className="bg-gradient-to-r from-amber-950 to-orange-950 border border-amber-800/60 p-4 rounded-2xl text-center space-y-1">
            <div className="text-xs text-amber-400 uppercase font-bold tracking-wider">Official Match Winner</div>
            <div className="text-lg font-heading font-black text-amber-300">🏆 {match.resultSummary}</div>
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
