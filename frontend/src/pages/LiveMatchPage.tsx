import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, CheckCircle2, Activity, ArrowLeft, Award, Flame, Circle, Zap, UserCheck } from 'lucide-react';
import { Match, Player } from '../types';
import { apiRequest } from '../services/api';
import { storage, liveMatchChannel } from '../services/storage';
import { BallTracker } from '../components/BallTracker';
import { useSocket } from '../context/SocketContext';

export const LiveMatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchMatch = async (isInitial = false) => {
    if (!id) return;
    if (isInitial && !match) setLoading(true);

    try {
      // Always use API as source of truth for public portal
      const res = await apiRequest<Match>(`/matches/${id}`);
      if (res) setMatch(res);
    } catch (err) {
      // Only use localStorage as fallback if API is down
      const localMatches = storage.getMatches();
      const localMatch = localMatches.find((m) => m.id === id);
      if (localMatch) setMatch(localMatch);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch(true);
    const interval = setInterval(() => fetchMatch(false), 1500);

    const handleEvent = () => fetchMatch(false);
    window.addEventListener('cricvalley_match_updated', handleEvent);
    window.addEventListener('storage', handleEvent);

    if (liveMatchChannel) {
      liveMatchChannel.onmessage = (ev) => {
        if (ev.data && ev.data.match && ev.data.match.id === id) {
          setMatch(ev.data.match);
        } else {
          fetchMatch(false);
        }
      };
    }

    if (socket) {
      socket.on('match_updated', (updatedData: Match) => {
        if (updatedData && updatedData.id === id) setMatch(updatedData);
        else fetchMatch(false);
      });
      socket.on('ball_recorded', (updatedData: Match) => {
        if (updatedData && updatedData.id === id) setMatch(updatedData);
        else fetchMatch(false);
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

  if (loading || !match) {
    return <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Loading live match scoreboard...</div>;
  }

  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const isInn2Active = inn2 && (inn1?.isCompleted || (inn2.balls && inn2.balls.length > 0) || inn2.totalRuns > 0 || inn2.overs > 0);
  const activeInnings = (isInn2Active ? inn2 : inn1) || inn1;
  const battingTeam = activeInnings?.battingTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
  const bowlingTeam = activeInnings?.battingTeamId === match.homeTeamId ? match.awayTeam : match.homeTeam;

  const homePlayers = match.homeTeam?.players || [];
  const awayPlayers = match.awayTeam?.players || [];
  const storagePlayers = storage.getPlayers();

  const allPlayersMap = new Map<string, Player>();
  [...homePlayers, ...awayPlayers, ...storagePlayers].forEach((p) => {
    if (p && p.id) allPlayersMap.set(p.id, p);
  });

  if (activeInnings && activeInnings.balls) {
    activeInnings.balls.forEach((b) => {
      if (b.striker && b.striker.id) allPlayersMap.set(b.striker.id, b.striker);
      if (b.bowler && b.bowler.id) allPlayersMap.set(b.bowler.id, b.bowler);
    });
  }

  const getPlayerData = (playerId?: string, ballPlayerObj?: any, defaultName = 'Player') => {
    if (playerId && allPlayersMap.has(playerId)) return allPlayersMap.get(playerId)!;
    if (ballPlayerObj && ballPlayerObj.name) return ballPlayerObj;
    return { name: defaultName } as Player;
  };

  // Calculate batter & bowler stats dynamically from activeInnings.balls
  const playerStatsMap: Record<string, { runs: number; balls: number; fours: number; sixes: number }> = {};
  const bowlerStatsMap: Record<string, { balls: number; runsConceded: number; wickets: number }> = {};
  const activeBattersSet = new Set<string>();
  const activeBowlersSet = new Set<string>();

  if (activeInnings && activeInnings.balls) {
    activeInnings.balls.forEach((b) => {
      const sId = b.strikerId;
      const nsId = b.nonStrikerId;
      const bwId = b.bowlerId;

      if (sId) {
        activeBattersSet.add(sId);
        if (!playerStatsMap[sId]) playerStatsMap[sId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
        if (b.extraType !== 'WIDE' && b.extraType !== 'BYE' && b.extraType !== 'LEG_BYE') {
          playerStatsMap[sId].runs += b.runs;
        }
        if (b.extraType !== 'WIDE') playerStatsMap[sId].balls += 1;
        if (b.runs === 4) playerStatsMap[sId].fours += 1;
        if (b.runs === 6) playerStatsMap[sId].sixes += 1;
      }

      if (nsId) {
        activeBattersSet.add(nsId);
        if (!playerStatsMap[nsId]) playerStatsMap[nsId] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
      }

      if (bwId) {
        activeBowlersSet.add(bwId);
        if (!bowlerStatsMap[bwId]) bowlerStatsMap[bwId] = { balls: 0, runsConceded: 0, wickets: 0 };
        const isLegal = b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL';
        if (isLegal) bowlerStatsMap[bwId].balls += 1;
        let wide = b.extraType === 'WIDE' ? (1 + b.runs) : 0;
        let noBall = b.extraType === 'NO_BALL' ? (1 + b.runs) : 0;
        let runsOnBowler = (b.extraType === 'BYE' || b.extraType === 'LEG_BYE') ? 0 : b.runs;
        bowlerStatsMap[bwId].runsConceded += runsOnBowler + wide + noBall;
        if (b.isWicket && b.wicketType !== 'RUN_OUT') bowlerStatsMap[bwId].wickets += 1;
      }
    });
  }

  const activeBattersList: string[] = Array.from(activeBattersSet);
  const activeBowlersList: string[] = Array.from(activeBowlersSet);

  const lastBall = activeInnings?.balls && activeInnings.balls.length > 0 ? activeInnings.balls[activeInnings.balls.length - 1] : null;
  const strikerId = lastBall?.strikerId || '';
  const nonStrikerId = lastBall?.nonStrikerId || '';
  const bowlerId = lastBall?.bowlerId || '';

  const strikerPlayer = strikerId ? getPlayerData(strikerId, lastBall?.striker) : null;
  const nonStrikerPlayer = nonStrikerId ? getPlayerData(nonStrikerId) : null;
  const activeBowlerPlayer = bowlerId ? getPlayerData(bowlerId, lastBall?.bowler) : null;

  const strikerStats = strikerId ? (playerStatsMap[strikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 }) : null;
  const nonStrikerStats = nonStrikerId ? (playerStatsMap[nonStrikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0 }) : null;
  const activeBowlerStats = bowlerId ? (bowlerStatsMap[bowlerId] || { balls: 0, runsConceded: 0, wickets: 0 }) : null;

  // Run rate calculations
  const totalOvers = activeInnings ? activeInnings.overs : 0;
  const totalOversDecimal = Math.floor(totalOvers) + (totalOvers % 1) * 10 / 6;
  const currentRunRate = totalOversDecimal > 0 && activeInnings ? (activeInnings.totalRuns / totalOversDecimal).toFixed(2) : '0.00';

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to All Matches
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Match Stage & Live Status Header */}
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

        {/* 🪙 Toss Information Banner */}
        {match.tossWinnerId && (
          <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-amber-300 shadow-sm">
            <span className="text-base">🪙</span>
            <span>
              <strong>{match.tossWinnerId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name}</strong> won the toss and elected to <strong>{match.tossDecision || 'BAT'}</strong> first.
            </span>
          </div>
        )}

        {/* Main Teams & Live Score Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={`border p-6 rounded-3xl space-y-2 text-center transition-all ${
            activeInnings?.battingTeamId === match.homeTeamId
              ? 'bg-gradient-to-b from-slate-950 to-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 font-black flex items-center justify-center mx-auto text-base border border-emerald-800 shadow-md">
              {match.homeTeam.shortName}
            </div>
            <div className="font-heading font-black text-white text-lg">{match.homeTeam.name}</div>
            <div className="text-4xl font-mono font-black text-emerald-400">
              {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono font-semibold">
              {inn1 ? `${inn1.overs} Overs` : 'Yet to Bat'}
            </div>
          </div>

          <div className={`border p-6 rounded-3xl space-y-2 text-center transition-all ${
            activeInnings?.battingTeamId === match.awayTeamId
              ? 'bg-gradient-to-b from-slate-950 to-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 font-black flex items-center justify-center mx-auto text-sm border border-emerald-800 shadow-md">
              {match.awayTeam.shortName}
            </div>
            <div className="font-heading font-black text-white text-lg">{match.awayTeam.name}</div>
            <div className="text-4xl font-mono font-black text-emerald-400">
              {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : '-'}
            </div>
            <div className="text-xs text-slate-400 font-mono font-semibold">
              {inn2 ? `${inn2.overs} Overs` : 'Yet to Bat'}
            </div>
          </div>
        </div>

        {/* CURRENT LIVE BATTERS & BOWLER SCORECARD PANEL */}
        {(match.status === 'LIVE' || match.status === 'COMPLETED' || match.status === 'UPCOMING') && (
          <div className="space-y-6 bg-slate-950 border border-slate-800 p-5 rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Batter & Bowler Scorecard ({battingTeam?.name || 'Batting Team'})
              </span>
              {match.status === 'LIVE' && (
                <span className="font-mono text-slate-400 font-semibold">CRR: <strong className="text-white">{currentRunRate}</strong></span>
              )}
            </div>

            {/* Current Batters Table */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                <span>Batting Performance:</span>
                <span className="text-emerald-400 font-mono">* Facing Striker</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-900 uppercase tracking-wider">
                      <th className="py-2 px-2">Batter</th>
                      <th className="py-2 px-2 text-center">R (B)</th>
                      <th className="py-2 px-2 text-center">4s</th>
                      <th className="py-2 px-2 text-center">6s</th>
                      <th className="py-2 px-2 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 font-medium">
                    {activeBattersList.length > 0 ? (
                      activeBattersList.map((bId) => {
                        const p = getPlayerData(bId, undefined, `Player (${bId.slice(0, 4)})`);
                        const s = playerStatsMap[bId] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
                        const isStriker = bId === strikerId;
                        const isNonStriker = bId === nonStrikerId;
                        const isFacing = isStriker || isNonStriker;

                        return (
                          <tr key={bId} className={isStriker ? 'text-white bg-emerald-950/20 font-bold' : 'text-slate-300'}>
                            <td className="py-2.5 px-2 font-bold text-white flex items-center gap-1">
                              <span className={isStriker ? 'text-emerald-400 font-extrabold' : ''}>{p.name}</span>
                              {isStriker && <span className="text-amber-400 font-black">*</span>}
                              {!isFacing && <span className="text-[10px] text-slate-500 font-normal ml-1">(out)</span>}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                              {s.runs} ({s.balls})
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{s.fours}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-amber-400 font-bold">{s.sixes}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-cyan-400">
                              {s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <>
                        {strikerPlayer && (
                          <tr className="text-white">
                            <td className="py-2.5 px-2 font-bold text-emerald-400 flex items-center gap-1">
                              {strikerPlayer.name} <span className="text-amber-400 font-black">*</span>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                              {strikerStats?.runs || 0} ({strikerStats?.balls || 0})
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{strikerStats?.fours || 0}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-amber-400 font-bold">{strikerStats?.sixes || 0}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-cyan-400">
                              {strikerStats && strikerStats.balls > 0 ? ((strikerStats.runs / strikerStats.balls) * 100).toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        )}
                        {nonStrikerPlayer && (
                          <tr className="text-slate-300">
                            <td className="py-2.5 px-2 font-bold text-slate-200">
                              {nonStrikerPlayer.name}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-white">
                              {nonStrikerStats?.runs || 0} ({nonStrikerStats?.balls || 0})
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-slate-300">{nonStrikerStats?.fours || 0}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-amber-400 font-bold">{nonStrikerStats?.sixes || 0}</td>
                            <td className="py-2.5 px-2 text-right font-mono text-cyan-400">
                              {nonStrikerStats && nonStrikerStats.balls > 0 ? ((nonStrikerStats.runs / nonStrikerStats.balls) * 100).toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Innings Bowlers Table */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Bowling Figures:</div>
              <div className="space-y-2">
                {activeBowlersList.length > 0 ? (
                  activeBowlersList.map((bId) => {
                    const p = getPlayerData(bId, undefined, `Bowler (${bId.slice(0, 4)})`);
                    const bs = bowlerStatsMap[bId] || { balls: 0, runsConceded: 0, wickets: 0 };
                    const isActive = bId === bowlerId;

                    return (
                      <div key={bId} className={`p-3 bg-slate-900 border ${isActive ? 'border-cyan-500/50' : 'border-slate-800'} rounded-2xl flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${isActive ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-400' : 'bg-slate-800 text-slate-400'} font-bold flex items-center justify-center text-xs`}>
                            ⚾
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                              {p.name} {isActive && <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-700/50 px-1.5 py-0.5 rounded uppercase font-mono">Bowling Now</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Econ: <strong className="text-slate-200">{bs.balls > 0 ? (bs.runsConceded / (bs.balls / 6)).toFixed(2) : '0.00'}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-base font-black text-cyan-400">
                            {Math.floor(bs.balls / 6)}.{bs.balls % 6} <span className="text-xs text-slate-400 font-normal">ov</span>
                          </div>
                          <div className="text-xs text-slate-300 font-bold">
                            {bs.runsConceded} Runs • <strong className="text-red-400">{bs.wickets} Wkts</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : activeBowlerPlayer ? (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold flex items-center justify-center text-xs">
                        ⚾
                      </div>
                      <div>
                        <div className="font-extrabold text-white text-xs">{activeBowlerPlayer.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Econ: <strong className="text-slate-200">{activeBowlerStats && activeBowlerStats.balls > 0 ? (activeBowlerStats.runsConceded / (activeBowlerStats.balls / 6)).toFixed(2) : '0.00'}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-base font-black text-cyan-400">
                        {activeBowlerStats ? `${Math.floor(activeBowlerStats.balls / 6)}.${activeBowlerStats.balls % 6}` : '0.0'} <span className="text-xs text-slate-400 font-normal">ov</span>
                      </div>
                      <div className="text-xs text-slate-300 font-bold">
                        {activeBowlerStats?.runsConceded || 0} Runs • <strong className="text-red-400">{activeBowlerStats?.wickets || 0} Wkts</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-500 text-xs italic">No bowler statistics recorded yet</div>
                )}
              </div>
            </div>
          </div>
        )}

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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Ball Commentary Feed</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {[...activeInnings.balls].reverse().map((b, idx) => (
                <div key={b.id || idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">{b.overNumber}.{b.ballNumberInOver}</span>
                    <span className="text-slate-200 font-medium">{b.commentary}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-black text-[11px] shrink-0 ${
                    b.isWicket ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : b.runs === 6 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : b.runs === 4 ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {b.isWicket ? 'OUT' : `${b.runs} RUNS`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Summary (Render ONLY when match is COMPLETED) */}
        {match.status === 'COMPLETED' && match.resultSummary && (
          <div className="bg-gradient-to-r from-amber-950 to-orange-950 border border-amber-800/60 p-5 rounded-2xl text-center space-y-1 shadow-lg">
            <div className="text-xs text-amber-400 uppercase font-bold tracking-wider">Official Match Result</div>
            <div className="text-xl font-heading font-black text-amber-300">🏆 {match.resultSummary}</div>
          </div>
        )}

        {/* Man of the Match Badge (Render ONLY when match is COMPLETED) */}
        {match.status === 'COMPLETED' && match.playerOfTheMatch && (
          <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-800/60 p-5 rounded-2xl text-center space-y-1 shadow-lg">
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
