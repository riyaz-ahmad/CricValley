import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Match } from '../types';
import { apiRequest } from '../services/api';
import { storage } from '../services/storage';

export const BroadcastOverlayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);

  const fetchMatch = async () => {
    if (!id) return;
    try {
      const res = await apiRequest<Match>(`/matches/${id}`);
      setMatch(res);
    } catch (err) {
      const allMatches = storage.getMatches();
      const found = allMatches.find((m) => m.id === id) || null;
      setMatch(found);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (!match) return <div className="p-4 text-xs text-emerald-400 font-bold bg-black/40">Loading Broadcast Overlay...</div>;

  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const activeInnings = (inn2 && !inn2.isCompleted ? inn2 : inn1) || inn1;

  const allPlayers = storage.getPlayers();
  const playerStatsMap: Record<string, { runs: number; balls: number; fours: number; sixes: number }> = {};
  const bowlerStatsMap: Record<string, { balls: number; runsConceded: number; wickets: number }> = {};

  if (activeInnings && activeInnings.balls) {
    activeInnings.balls.forEach((b) => {
      if (b.strikerId) {
        if (!playerStatsMap[b.strikerId]) playerStatsMap[b.strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
        playerStatsMap[b.strikerId].runs += b.runs;
        if (b.extraType !== 'WIDE') playerStatsMap[b.strikerId].balls += 1;
        if (b.runs === 4) playerStatsMap[b.strikerId].fours += 1;
        if (b.runs === 6) playerStatsMap[b.strikerId].sixes += 1;
      }
      if (b.bowlerId) {
        if (!bowlerStatsMap[b.bowlerId]) bowlerStatsMap[b.bowlerId] = { balls: 0, runsConceded: 0, wickets: 0 };
        const isLegal = b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL';
        if (isLegal) bowlerStatsMap[b.bowlerId].balls += 1;
        let wide = b.extraType === 'WIDE' ? 1 : 0;
        let noBall = b.extraType === 'NO_BALL' ? 1 : 0;
        bowlerStatsMap[b.bowlerId].runsConceded += b.runs + wide + noBall;
        if (b.isWicket) bowlerStatsMap[b.bowlerId].wickets += 1;
      }
    });
  }

  const lastBall = activeInnings?.balls && activeInnings.balls.length > 0 ? activeInnings.balls[activeInnings.balls.length - 1] : null;
  const strikerId = lastBall?.strikerId;
  const nonStrikerId = lastBall?.nonStrikerId;
  const bowlerId = lastBall?.bowlerId;

  const strikerPlayer = allPlayers.find((p) => p.id === strikerId);
  const nonStrikerPlayer = allPlayers.find((p) => p.id === nonStrikerId);
  const activeBowlerPlayer = allPlayers.find((p) => p.id === bowlerId);

  const strikerStats = strikerId ? playerStatsMap[strikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 } : null;
  const nonStrikerStats = nonStrikerId ? playerStatsMap[nonStrikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 } : null;
  const activeBowlerStats = bowlerId ? bowlerStatsMap[bowlerId] || { balls: 0, runsConceded: 0, wickets: 0 } : null;

  return (
    <div className="w-screen h-screen bg-transparent p-4 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Banner (TV Header) */}
      <div className="flex items-center justify-between">
        <div className="bg-slate-950/90 border border-emerald-500/40 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl text-xs">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-ping"></div>
          <div className="font-heading font-black text-emerald-400 uppercase tracking-wider">
            {match.tournament?.title || 'CricValley Live'}
          </div>
          <span className="text-slate-400 font-bold">• Match #{match.matchNumber}</span>
        </div>

        {match.tossWinnerId && (
          <div className="bg-slate-950/90 border border-amber-500/40 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold text-amber-300 shadow-2xl">
            🪙 {match.tossWinnerId === match.homeTeamId ? match.homeTeam.shortName : match.awayTeam.shortName} won toss & elected to {match.tossDecision || 'BAT'}
          </div>
        )}
      </div>

      {/* Bottom TV Sports Lower-Third Overlay */}
      <div className="max-w-5xl mx-auto w-full space-y-2">
        {/* Recent Balls Strip */}
        {activeInnings?.balls && activeInnings.balls.length > 0 && (
          <div className="flex justify-end gap-1.5 pr-2">
            {activeInnings.balls.slice(-6).map((b, idx) => (
              <span
                key={idx}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-lg ${
                  b.isWicket
                    ? 'bg-red-600 text-white animate-bounce'
                    : b.runs === 6
                    ? 'bg-amber-500 text-slate-950'
                    : b.runs === 4
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-700'
                }`}
              >
                {b.isWicket ? 'W' : b.runs}
              </span>
            ))}
          </div>
        )}

        {/* Lower Third Main Bar */}
        <div className="bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-3xl p-4 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Section 1: Team & Score */}
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 px-4 py-2 rounded-2xl font-heading font-black text-xl shadow-lg">
              {activeInnings?.battingTeam?.shortName || match.homeTeam.shortName}
            </div>
            <div>
              <div className="text-3xl font-mono font-black text-white leading-none">
                {activeInnings?.totalRuns || 0}/{activeInnings?.wickets || 0}
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold mt-1">
                {activeInnings?.overs || 0} Overs
              </div>
            </div>
          </div>

          {/* Section 2: Active Batters */}
          <div className="text-xs space-y-1 border-l border-r border-slate-800/80 px-4">
            {strikerPlayer && (
              <div className="flex items-center justify-between text-white font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  {strikerPlayer.name} <strong className="text-amber-400">*</strong>
                </span>
                <span className="font-mono text-amber-300">
                  {strikerStats?.runs} <span className="text-slate-400 text-[10px]">({strikerStats?.balls}b)</span>
                </span>
              </div>
            )}
            {nonStrikerPlayer && (
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>{nonStrikerPlayer.name}</span>
                <span className="font-mono text-white">
                  {nonStrikerStats?.runs} <span className="text-slate-500 text-[10px]">({nonStrikerStats?.balls}b)</span>
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Active Bowler & Match Result */}
          <div className="text-xs space-y-1 text-right">
            {activeBowlerPlayer ? (
              <div>
                <div className="text-cyan-400 font-bold uppercase text-[10px]">Active Bowler:</div>
                <div className="text-white font-black text-sm">{activeBowlerPlayer.name}</div>
                <div className="font-mono text-slate-300 text-[11px] font-bold">
                  {activeBowlerStats ? `${Math.floor(activeBowlerStats.balls / 6)}.${activeBowlerStats.balls % 6}` : '0.0'}-
                  {activeBowlerStats?.runsConceded || 0}-
                  <span className="text-red-400">{activeBowlerStats?.wickets || 0}</span>
                </div>
              </div>
            ) : match.resultSummary ? (
              <div className="text-amber-300 font-black text-sm">🏆 {match.resultSummary}</div>
            ) : (
              <div className="text-slate-400 italic">CricValley Live Broadcast</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
