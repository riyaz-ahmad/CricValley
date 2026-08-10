import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Match } from '../types';
import { apiRequest } from '../services/api';
import { storage, liveMatchChannel } from '../services/storage';
import { useSocket } from '../context/SocketContext';

export const BroadcastOverlayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const { socket } = useSocket();

  const fetchMatch = async () => {
    if (!id) return;
    const localMatches = storage.getMatches();
    const localMatch = localMatches.find((m) => m.id === id) || null;

    try {
      const res = await apiRequest<Match>(`/matches/${id}`);
      const localBallsCount = localMatch?.innings?.reduce((acc, inn) => acc + (inn.balls?.length || 0), 0) || 0;
      const resBallsCount = res?.innings?.reduce((acc, inn) => acc + (inn.balls?.length || 0), 0) || 0;

      if (localMatch && localBallsCount >= resBallsCount) {
        setMatch(localMatch);
      } else {
        setMatch(res);
      }
    } catch (err) {
      if (localMatch) setMatch(localMatch);
    }
  };

  useEffect(() => {
    fetchMatch();
    const interval = setInterval(fetchMatch, 500);

    const handleEvent = () => fetchMatch();
    window.addEventListener('cricvalley_match_updated', handleEvent);
    window.addEventListener('storage', handleEvent);

    if (liveMatchChannel) {
      liveMatchChannel.onmessage = (ev) => {
        if (ev.data && ev.data.match && ev.data.match.id === id) {
          setMatch(ev.data.match);
        } else {
          fetchMatch();
        }
      };
    }

    if (socket) {
      socket.on('match_updated', (updatedData: Match) => {
        if (updatedData && updatedData.id === id) setMatch(updatedData);
        else fetchMatch();
      });
      socket.on('ball_recorded', (updatedData: Match) => {
        if (updatedData && updatedData.id === id) setMatch(updatedData);
        else fetchMatch();
      });
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
  }, [id, socket]);

  const [eventGraphicText, setEventGraphicText] = useState<string>('');
  const [showEventGraphic, setShowEventGraphic] = useState<boolean>(false);
  const [lastProcessedBallId, setLastProcessedBallId] = useState<string>('');

  if (!match) return <div className="w-screen h-screen bg-transparent"></div>;

  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const isInn2Active = inn2 && (inn1?.isCompleted || (inn2.balls && inn2.balls.length > 0) || inn2.totalRuns > 0 || inn2.overs > 0);
  const activeInnings = (isInn2Active ? inn2 : inn1) || inn1;
  const battingTeam = activeInnings?.battingTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
  const bowlingTeam = activeInnings?.battingTeamId === match.homeTeamId ? match.awayTeam : match.homeTeam;

  const lastBall = activeInnings?.balls && activeInnings.balls.length > 0 ? activeInnings.balls[activeInnings.balls.length - 1] : null;

  useEffect(() => {
    if (lastBall && lastBall.id !== lastProcessedBallId) {
      setLastProcessedBallId(lastBall.id);
      if (lastBall.isWicket) {
        setEventGraphicText('WICKET! 🚨');
        setShowEventGraphic(true);
      } else if (lastBall.runs === 6) {
        setEventGraphicText('SIX! 🚀');
        setShowEventGraphic(true);
      } else if (lastBall.runs === 4) {
        setEventGraphicText('FOUR! 💥');
        setShowEventGraphic(true);
      }

      const timer = setTimeout(() => setShowEventGraphic(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastBall, lastProcessedBallId]);

  const homePlayers = match.homeTeam?.players || [];
  const awayPlayers = match.awayTeam?.players || [];
  const storagePlayers = storage.getPlayers();

  const allPlayersMap = new Map<string, any>();
  [...homePlayers, ...awayPlayers, ...storagePlayers].forEach((p) => {
    if (p && p.id) allPlayersMap.set(p.id, p);
  });

  const getPlayerData = (playerId?: string, ballPlayerObj?: any, defaultName = 'Player') => {
    if (playerId && allPlayersMap.has(playerId)) return allPlayersMap.get(playerId)!;
    if (ballPlayerObj && ballPlayerObj.name) return ballPlayerObj;
    return { name: defaultName };
  };

  const playerStatsMap: Record<string, { runs: number; balls: number; fours: number; sixes: number }> = {};
  const bowlerStatsMap: Record<string, { balls: number; runsConceded: number; wickets: number }> = {};

  if (activeInnings && activeInnings.balls) {
    activeInnings.balls.forEach((b) => {
      if (b.strikerId) {
        if (!playerStatsMap[b.strikerId]) playerStatsMap[b.strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
        if (b.extraType !== 'WIDE' && b.extraType !== 'BYE' && b.extraType !== 'LEG_BYE') {
          playerStatsMap[b.strikerId].runs += b.runs;
        }
        if (b.extraType !== 'WIDE') playerStatsMap[b.strikerId].balls += 1;
        if (b.runs === 4) playerStatsMap[b.strikerId].fours += 1;
        if (b.runs === 6) playerStatsMap[b.strikerId].sixes += 1;
      }
      if (b.bowlerId) {
        if (!bowlerStatsMap[b.bowlerId]) bowlerStatsMap[b.bowlerId] = { balls: 0, runsConceded: 0, wickets: 0 };
        const isLegal = b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL';
        if (isLegal) bowlerStatsMap[b.bowlerId].balls += 1;
        let wide = b.extraType === 'WIDE' ? (1 + b.runs) : 0;
        let noBall = b.extraType === 'NO_BALL' ? (1 + b.runs) : 0;
        let runsOnBowler = (b.extraType === 'BYE' || b.extraType === 'LEG_BYE') ? 0 : b.runs;
        bowlerStatsMap[b.bowlerId].runsConceded += runsOnBowler + wide + noBall;
        if (b.isWicket && b.wicketType !== 'RUN_OUT') bowlerStatsMap[b.bowlerId].wickets += 1;
      }
    });
  }

  const strikerId = lastBall?.strikerId;
  const nonStrikerId = lastBall?.nonStrikerId;
  const bowlerId = lastBall?.bowlerId;

  const strikerPlayer = getPlayerData(strikerId, lastBall?.striker, (battingTeam.players && battingTeam.players[0]?.name) || 'Striker');
  const nonStrikerPlayer = getPlayerData(nonStrikerId, undefined, (battingTeam.players && battingTeam.players[1]?.name) || 'Non-Striker');
  const activeBowlerPlayer = getPlayerData(bowlerId, lastBall?.bowler, (bowlingTeam.players && bowlingTeam.players[0]?.name) || 'Bowler');

  const strikerStats = strikerId ? playerStatsMap[strikerId] || { runs: 0, balls: 0 } : { runs: 0, balls: 0 };
  const nonStrikerStats = nonStrikerId ? playerStatsMap[nonStrikerId] || { runs: 0, balls: 0 } : { runs: 0, balls: 0 };
  const activeBowlerStats = bowlerId ? bowlerStatsMap[bowlerId] || { balls: 0, runsConceded: 0, wickets: 0 } : { balls: 0, runsConceded: 0, wickets: 0 };

  const bowlerOversStr = `${Math.floor(activeBowlerStats.balls / 6)}.${activeBowlerStats.balls % 6}`;

  // Calculate Run Rate
  const totalRuns = activeInnings?.totalRuns ?? 0;
  const wickets = activeInnings?.wickets ?? 0;
  const overs = activeInnings?.overs ?? 0.0;
  const runRate = overs > 0 ? (totalRuns / (Math.floor(overs) + (overs % 1) * (10 / 6))).toFixed(2) : '0.00';

  // 2nd Innings Run Chase & Required Run Rate (RRR) Calculations
  const isSecondInnings = activeInnings?.inningNumber === 2 && inn1;
  const targetRuns = match.targetRuns || (inn1 ? inn1.totalRuns + 1 : 0);
  const runsNeeded = Math.max(0, targetRuns - totalRuns);
  const maxMatchOvers = match.tournament?.overs || 20;
  const ballsBowledInInn = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
  const ballsRemaining = Math.max(0, (maxMatchOvers * 6) - ballsBowledInInn);
  const reqRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';

  const recentBalls = activeInnings?.balls && activeInnings.balls.length > 0
    ? activeInnings.balls.slice(-6)
    : [];

  return (
    <div className="w-screen h-screen bg-transparent p-4 flex flex-col justify-end items-center overflow-hidden select-none space-y-3">
      {/* 💥 ANIMATED EVENT OVERLAY GRAPHIC POPUP (FOUR / SIX / WICKET) */}
      {showEventGraphic && (
        <div className="animate-bounce transition-all duration-300">
          <div className={`px-8 py-3 rounded-3xl font-black font-heading text-3xl shadow-2xl border-4 tracking-wider uppercase flex items-center gap-3 ${
            eventGraphicText.includes('WICKET')
              ? 'bg-red-600 text-white border-red-400 shadow-red-500/50'
              : eventGraphicText.includes('SIX')
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/50'
              : 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/50'
          }`}>
            {eventGraphicText}
          </div>
        </div>
      )}

      {/* 🎯 2ND INNINGS RUN CHASE TICKER BANNER */}
      {isSecondInnings && (
        <div className="bg-[#200a46] border-2 border-[#e6007e] text-white px-6 py-1.5 rounded-full shadow-2xl flex items-center gap-3 font-mono font-black text-xs uppercase tracking-wider animate-pulse">
          <span className="text-[#e6e600]">RUN CHASE TARGET: {targetRuns}</span>
          <span>•</span>
          <span className="text-white">NEED {runsNeeded} RUNS IN {ballsRemaining} BALLS</span>
          <span>•</span>
          <span className="text-cyan-300">RRR: {reqRunRate}</span>
        </div>
      )}

      {/* PROFESSIONAL TV BROADCAST LOWER-THIRD SCOREBAR */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-center filter drop-shadow-2xl">
        <div className="flex items-center bg-[#200a46] p-1 rounded-r-2xl border-t-2 border-b-2 border-[#3d137b]">
          
          {/* Left Angle Chevron Cap */}
          <div className="w-6 h-14 bg-[#200a46] flex items-center justify-center -mr-2 z-10 clip-chevron-left"></div>

          {/* 1. BATTERS BOX (WHITE BACKGROUND PANEL) */}
          <div className="bg-white text-black px-5 py-2 flex flex-col justify-center min-w-[240px] font-sans h-14 z-20 shadow-md">
            {/* Striker Row */}
            <div className="flex items-center justify-between text-sm font-extrabold uppercase tracking-tight leading-tight">
              <span className="flex items-center gap-1 text-[#111]">
                {strikerPlayer.name} <span className="text-[#e6007e] font-black">*</span>
              </span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-base font-black text-black">{String(strikerStats.runs).padStart(2, '0')}</span>
                <span className="text-[11px] font-bold text-gray-600">{strikerStats.balls}</span>
              </div>
            </div>

            {/* Non-Striker Row */}
            <div className="flex items-center justify-between text-sm font-extrabold uppercase tracking-tight leading-tight mt-0.5">
              <span className="text-[#333]">{nonStrikerPlayer.name}</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-base font-black text-black">{String(nonStrikerStats.runs).padStart(2, '0')}</span>
                <span className="text-[11px] font-bold text-gray-600">{nonStrikerStats.balls}</span>
              </div>
            </div>
          </div>

          {/* Slanted Separator Angle */}
          <div className="w-8 h-14 bg-[#200a46] -ml-2 -mr-2 z-30 transform -skew-x-[20deg]"></div>

          {/* 2. CENTER MATCH SCORE BOX (DARK PURPLE + HOT PINK + YELLOW POWERPLAY) */}
          <div className="bg-[#200a46] text-white px-5 py-1.5 flex flex-col justify-center items-center h-14 z-20">
            {/* Row 1: Teams + Score Box + Powerplay + Overs */}
            <div className="flex items-center gap-3">
              <div className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                {bowlingTeam.shortName || 'SAN'} v <strong className="text-white font-black">{battingTeam.shortName || 'SAR'}</strong>
              </div>

              {/* Hot Pink Score Pill */}
              <div className="bg-[#e6007e] text-white font-mono font-black text-2xl px-3 py-0.5 rounded-l-sm shadow-md flex items-center justify-center leading-none">
                {totalRuns}-{wickets}
              </div>

              {/* Yellow Powerplay Badge */}
              <div className="bg-[#e6e600] text-black font-mono font-black text-xs px-2 py-1 flex items-center justify-center leading-none uppercase">
                P2
              </div>

              {/* Overs Count */}
              <div className="text-xs font-black uppercase text-slate-100 tracking-wide font-mono">
                {overs} OVERS
              </div>
            </div>

            {/* Row 2: Run Rate */}
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-200 mt-0.5">
              RUN RATE {runRate}
            </div>
          </div>

          {/* Slanted Separator Angle */}
          <div className="w-8 h-14 bg-[#200a46] -ml-2 -mr-2 z-30 transform -skew-x-[20deg]"></div>

          {/* 3. BOWLER & BALL-BY-BALL BOX (WHITE BACKGROUND PANEL) */}
          <div className="bg-white text-black px-5 py-2 flex flex-col justify-center min-w-[260px] font-sans h-14 z-20 shadow-md">
            {/* Bowler Row */}
            <div className="flex items-center justify-between text-sm font-extrabold uppercase tracking-tight leading-tight">
              <span className="text-[#111]">{activeBowlerPlayer.name}</span>
              <div className="flex items-baseline gap-1 font-mono font-black text-black">
                <span>{activeBowlerStats.wickets}-{activeBowlerStats.runsConceded}</span>
                <span className="text-xs text-gray-600 font-bold">({bowlerOversStr})</span>
              </div>
            </div>

            {/* Recent Balls Circular Badges Row */}
            <div className="flex items-center gap-1.5 mt-1">
              {recentBalls.map((b, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black font-mono shadow-sm ${
                    b.isWicket
                      ? 'bg-red-600 text-white animate-pulse'
                      : b.runs === 6
                      ? 'bg-amber-500 text-slate-950'
                      : b.runs === 4
                      ? 'bg-[#200a46] text-white border border-purple-400'
                      : 'bg-[#200a46] text-white'
                  }`}
                >
                  {b.isWicket ? 'W' : b.runs === 0 ? '0' : b.runs}
                </div>
              ))}
            </div>
          </div>

          {/* Right Angle Chevron Tip */}
          <div className="w-6 h-14 bg-[#200a46] flex items-center justify-center -ml-2 z-10 clip-chevron-right rounded-r-lg"></div>

        </div>
      </div>
    </div>
  );
};
