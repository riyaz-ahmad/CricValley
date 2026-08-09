import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Activity, Trophy, Circle, CheckCircle, Clock, Award } from 'lucide-react';
import { Match } from '../types';
import { apiRequest } from '../services/api';
import { storage, liveMatchChannel } from '../services/storage';
import { useSocket } from '../context/SocketContext';

export const MatchesPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchMatches = async (isInitial = false) => {
    if (isInitial && matches.length === 0) setLoading(true);
    let data: Match[] = [];
    try {
      let url = '/matches';
      if (statusFilter !== 'ALL') url += `?status=${statusFilter}`;
      data = await apiRequest<Match[]>(url);
    } catch (err) {
      data = storage.getMatches();
      if (statusFilter !== 'ALL') {
        data = data.filter((m) => m.status === statusFilter);
      }
    } finally {
      const localMatches = storage.getMatches();
      if (localMatches && localMatches.length > 0) {
        data = data.map((m) => {
          const foundLocal = localMatches.find((lm) => lm.id === m.id);
          if (foundLocal) {
            const localBalls = foundLocal.innings?.reduce((acc, inn) => acc + (inn.balls?.length || 0), 0) || 0;
            const apiBalls = m.innings?.reduce((acc, inn) => acc + (inn.balls?.length || 0), 0) || 0;
            return localBalls >= apiBalls ? foundLocal : m;
          }
          return m;
        });
      }
      setMatches(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(true);
    const interval = setInterval(() => fetchMatches(false), 1500);

    const handleEvent = () => fetchMatches(false);
    window.addEventListener('cricvalley_match_updated', handleEvent);
    window.addEventListener('storage', handleEvent);

    if (liveMatchChannel) {
      liveMatchChannel.onmessage = () => fetchMatches(false);
    }

    if (socket) {
      socket.on('match_updated', handleEvent);
      socket.on('ball_recorded', handleEvent);
      socket.on('match_status_changed', handleEvent);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('cricvalley_match_updated', handleEvent);
      window.removeEventListener('storage', handleEvent);
      if (socket) {
        socket.off('match_updated');
        socket.off('ball_recorded');
        socket.off('match_status_changed');
      }
    };
  }, [statusFilter, socket]);

  const getStageTag = (stage: string) => {
    switch (stage) {
      case 'FINAL':
        return { label: '🔥 FINAL', bg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black' };
      case 'SEMI_FINAL':
        return { label: '⚡ SEMI-FINAL', bg: 'bg-purple-950 text-purple-300 border border-purple-700 font-extrabold' };
      case 'QUARTER_FINAL':
        return { label: '🎯 QUARTER-FINAL', bg: 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold' };
      default:
        return { label: 'GROUP STAGE', bg: 'bg-slate-800 text-slate-300 font-semibold' };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-emerald-400" /> Matches, Fixtures & Scorecards
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live scoreboards, toss decisions, stage tags, and Man of the Match awards</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {(['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === s
                  ? s === 'LIVE'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 animate-pulse font-black'
                    : 'bg-emerald-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s === 'LIVE' && <Circle className="w-2.5 h-2.5 fill-current" />}
              {s === 'UPCOMING' && <Clock className="w-3.5 h-3.5" />}
              {s === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5" />}
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Loading match scoreboards...</div>
      ) : matches.length === 0 ? (
        <div className="py-20 text-center text-slate-500">No matches found for filter "{statusFilter}".</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => {
            const inn1 = m.innings?.find((i) => i.inningNumber === 1);
            const inn2 = m.innings?.find((i) => i.inningNumber === 2);
            const isLive = m.status === 'LIVE';
            const tag = getStageTag(m.stage);

            return (
              <div
                key={m.id}
                className={`bg-slate-900 border ${
                  isLive ? 'border-amber-500 shadow-amber-500/10 shadow-xl' : 'border-slate-800'
                } rounded-3xl p-6 space-y-4 shadow-xl hover:border-emerald-500/40 transition-all`}
              >
                {/* Match Top Info */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase ${tag.bg}`}>
                      {tag.label}
                    </span>
                    <span className="font-semibold text-slate-400">Match #{m.matchNumber}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                      isLive
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : m.status === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isLive && <Circle className="w-2 h-2 fill-current text-red-600" />}
                    {isLive ? 'LIVE ONGOING' : m.status}
                  </span>
                </div>

                {/* 🪙 Toss Banner */}
                {m.tossWinnerId && (
                  <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-[11px] font-semibold text-amber-300">
                    🪙 <strong>{m.tossWinnerId === m.homeTeamId ? m.homeTeam.name : m.awayTeam.name}</strong> won toss & elected to <strong>{m.tossDecision || 'BAT'}</strong> first.
                  </div>
                )}

                {/* Team Scores Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-800">
                        {m.homeTeam.shortName}
                      </div>
                      <span className="font-bold text-white text-base">{m.homeTeam.name}</span>
                    </div>
                    <span className="font-mono font-black text-lg text-emerald-400">
                      {inn1 && inn1.battingTeamId === m.homeTeamId
                        ? `${inn1.totalRuns}/${inn1.wickets} (${inn1.overs} ov)`
                        : inn2 && inn2.battingTeamId === m.homeTeamId
                        ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.overs} ov)`
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-800">
                        {m.awayTeam.shortName}
                      </div>
                      <span className="font-bold text-white text-base">{m.awayTeam.name}</span>
                    </div>
                    <span className="font-mono font-black text-lg text-emerald-400">
                      {inn1 && inn1.battingTeamId === m.awayTeamId
                        ? `${inn1.totalRuns}/${inn1.wickets} (${inn1.overs} ov)`
                        : inn2 && inn2.battingTeamId === m.awayTeamId
                        ? `${inn2.totalRuns}/${inn2.wickets} (${inn2.overs} ov)`
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Match Result / Man of the Match */}
                <div className="space-y-2">
                  {m.resultSummary && (
                    <div className="p-2.5 bg-amber-950/60 border border-amber-800/40 rounded-xl text-center text-xs font-bold text-amber-300">
                      🏆 {m.resultSummary}
                    </div>
                  )}

                  {m.playerOfTheMatch && (
                    <div className="p-2 bg-emerald-950/80 border border-emerald-800/50 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" /> Man of the Match: {m.playerOfTheMatch.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-800">
                  <span className="text-slate-400">{m.venue || 'Stadium'}</span>
                  <Link
                    to={`/matches/${m.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-md transition-all shrink-0"
                  >
                    View Scorecard →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
