import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, Play, RotateCcw, ArrowLeft, ArrowRightLeft, Circle, CheckCircle2, Award, Zap } from 'lucide-react';
import { Match, Player, Innings } from '../../types';
import { apiRequest } from '../../services/api';
import { storage } from '../../services/storage';
import { BallTracker } from '../../components/BallTracker';

export const AdminScorerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // Scorer Controls State
  const [selectedRuns, setSelectedRuns] = useState<number>(0);
  const [extraType, setExtraType] = useState<'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE'>('NONE');
  const [isWicket, setIsWicket] = useState<boolean>(false);
  const [wicketType, setWicketType] = useState<string>('BOWLED');
  const [showWicketModal, setShowWicketModal] = useState<boolean>(false);

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');
  const [commentaryText, setCommentaryText] = useState<string>('');
  const [postingBall, setPostingBall] = useState<boolean>(false);

  const fetchMatchData = async () => {
    if (!id) return;
    setLoading(true);
    let foundMatch: Match | null = null;
    try {
      foundMatch = await apiRequest<Match>(`/matches/${id}`);
    } catch (err) {
      const allMatches = storage.getMatches();
      foundMatch = allMatches.find((m) => m.id === id) || null;
    }

    if (foundMatch) {
      // Ensure innings structure initialized
      if (!foundMatch.innings || foundMatch.innings.length === 0) {
        foundMatch.innings = [
          {
            id: `inn-1-${foundMatch.id}`,
            matchId: foundMatch.id,
            inningNumber: 1,
            battingTeamId: foundMatch.homeTeamId,
            bowlingTeamId: foundMatch.awayTeamId,
            battingTeam: foundMatch.homeTeam,
            bowlingTeam: foundMatch.awayTeam,
            totalRuns: 0,
            wickets: 0,
            overs: 0.0,
            wideExtras: 0,
            noBallExtras: 0,
            byeExtras: 0,
            legByeExtras: 0,
            isCompleted: false,
            balls: [],
          },
        ];
      }

      setMatch(foundMatch);

      const activeInn = foundMatch.innings.find((i) => !i.isCompleted) || foundMatch.innings[0];
      if (activeInn) {
        const allPlayers = storage.getPlayers();
        const batPlayers = allPlayers.filter((p) => p.teamId === activeInn.battingTeamId);
        const bowlPlayers = allPlayers.filter((p) => p.teamId === activeInn.bowlingTeamId);

        if (batPlayers.length >= 2 && !strikerId) {
          setStrikerId(batPlayers[0].id);
          setNonStrikerId(batPlayers[1].id);
        } else if (batPlayers.length > 0 && !strikerId) {
          setStrikerId(batPlayers[0].id);
        }

        if (bowlPlayers.length > 0 && !bowlerId) {
          setBowlerId(bowlPlayers[0].id);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatchData();
  }, [id]);

  const saveUpdatedMatch = (updatedMatch: Match) => {
    setMatch(updatedMatch);
    const allMatches = storage.getMatches();
    const newMatches = allMatches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
    storage.saveMatches(newMatches);
  };

  if (loading || !match) {
    return <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Loading CricValley Live Scorer Console...</div>;
  }

  const allPlayers = storage.getPlayers();
  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const activeInnings = (inn2 && !inn2.isCompleted ? inn2 : inn1) || inn1;

  const batTeamPlayers = allPlayers.filter((p) => p.teamId === activeInnings?.battingTeamId);
  const bowlTeamPlayers = allPlayers.filter((p) => p.teamId === activeInnings?.bowlingTeamId);

  const handleStartMatch = (decision: 'BAT' | 'BOWL') => {
    const battingTeamId = decision === 'BAT' ? match.homeTeamId : match.awayTeamId;
    const bowlingTeamId = decision === 'BAT' ? match.awayTeamId : match.homeTeamId;

    const updatedMatch: Match = {
      ...match,
      status: 'LIVE',
      tossWinnerId: match.homeTeamId,
      tossDecision: decision,
      innings: [
        {
          id: `inn-1-${match.id}`,
          matchId: match.id,
          inningNumber: 1,
          battingTeamId,
          bowlingTeamId,
          battingTeam: decision === 'BAT' ? match.homeTeam : match.awayTeam,
          bowlingTeam: decision === 'BAT' ? match.awayTeam : match.homeTeam,
          totalRuns: 0,
          wickets: 0,
          overs: 0.0,
          wideExtras: 0,
          noBallExtras: 0,
          byeExtras: 0,
          legByeExtras: 0,
          isCompleted: false,
          balls: [],
        },
      ],
    };
    saveUpdatedMatch(updatedMatch);
  };

  const handleStartSecondInnings = () => {
    if (!inn1) return;
    const battingTeamId = inn1.battingTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    const bowlingTeamId = inn1.battingTeamId;

    const updatedMatch: Match = {
      ...match,
      targetRuns: inn1.totalRuns + 1,
      innings: [
        { ...inn1, isCompleted: true },
        {
          id: `inn-2-${match.id}`,
          matchId: match.id,
          inningNumber: 2,
          battingTeamId,
          bowlingTeamId,
          battingTeam: battingTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam,
          bowlingTeam: bowlingTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam,
          totalRuns: 0,
          wickets: 0,
          overs: 0.0,
          wideExtras: 0,
          noBallExtras: 0,
          byeExtras: 0,
          legByeExtras: 0,
          isCompleted: false,
          balls: [],
        },
      ],
    };
    saveUpdatedMatch(updatedMatch);
  };

  const handleSwapStrikers = () => {
    const temp = strikerId;
    setStrikerId(nonStrikerId);
    setNonStrikerId(temp);
  };

  const handleRecordBall = () => {
    if (!activeInnings) return alert('No active innings available!');
    setPostingBall(true);

    let runs = selectedRuns;
    let wide = extraType === 'WIDE' ? 1 : 0;
    let noBall = extraType === 'NO_BALL' ? 1 : 0;
    let totalBallRuns = runs + wide + noBall;

    let isLegalBall = extraType !== 'WIDE' && extraType !== 'NO_BALL';

    // Calculate overs increments
    let overNum = Math.floor(activeInnings.overs);
    let ballsInOver = Math.round((activeInnings.overs - overNum) * 10);

    if (isLegalBall) {
      ballsInOver += 1;
      if (ballsInOver >= 6) {
        overNum += 1;
        ballsInOver = 0;
      }
    }
    let newOversFormatted = parseFloat(`${overNum}.${ballsInOver}`);

    let newWickets = activeInnings.wickets + (isWicket ? 1 : 0);
    let newTotalRuns = activeInnings.totalRuns + totalBallRuns;

    const striker = allPlayers.find((p) => p.id === strikerId);
    const bowler = allPlayers.find((p) => p.id === bowlerId);

    const ballEvent = {
      id: `ball-${Date.now()}`,
      inningsId: activeInnings.id,
      overNumber: overNum,
      ballNumberInOver: ballsInOver,
      bowlerId,
      strikerId,
      nonStrikerId,
      runs,
      extraType,
      extraRuns: wide + noBall,
      isWicket,
      wicketType: isWicket ? wicketType : undefined,
      commentary: commentaryText || `${runs} runs scored by ${striker?.name || 'Batsman'}`,
      timestamp: new Date().toISOString(),
      striker,
      bowler,
    };

    const updatedBalls = [...(activeInnings.balls || []), ballEvent];

    const updatedInningsList = (match.innings || []).map((inn) => {
      if (inn.id !== activeInnings.id) return inn;
      return {
        ...inn,
        totalRuns: newTotalRuns,
        wickets: newWickets,
        overs: newOversFormatted,
        wideExtras: inn.wideExtras + wide,
        noBallExtras: inn.noBallExtras + noBall,
        balls: updatedBalls,
      };
    });

    let updatedMatch: Match = {
      ...match,
      status: 'LIVE',
      innings: updatedInningsList,
    };

    // Auto strike swap on odd runs
    if (runs % 2 !== 0) {
      handleSwapStrikers();
    }

    saveUpdatedMatch(updatedMatch);

    // Reset selection
    setSelectedRuns(0);
    setExtraType('NONE');
    setIsWicket(false);
    setCommentaryText('');
    setPostingBall(false);
  };

  const handleUndoBall = () => {
    if (!activeInnings || !activeInnings.balls || activeInnings.balls.length === 0) return alert('No balls to undo!');
    
    const updatedBalls = activeInnings.balls.slice(0, -1);
    const lastBall = activeInnings.balls[activeInnings.balls.length - 1];

    let runsDeducted = lastBall.runs + lastBall.extraRuns;
    let newWickets = Math.max(0, activeInnings.wickets - (lastBall.isWicket ? 1 : 0));
    let newTotalRuns = Math.max(0, activeInnings.totalRuns - runsDeducted);

    let isLegalBall = lastBall.extraType !== 'WIDE' && lastBall.extraType !== 'NO_BALL';
    let overNum = Math.floor(activeInnings.overs);
    let ballsInOver = Math.round((activeInnings.overs - overNum) * 10);

    if (isLegalBall) {
      if (ballsInOver === 0 && overNum > 0) {
        overNum -= 1;
        ballsInOver = 5;
      } else {
        ballsInOver = Math.max(0, ballsInOver - 1);
      }
    }
    let newOversFormatted = parseFloat(`${overNum}.${ballsInOver}`);

    const updatedInningsList = (match.innings || []).map((inn) => {
      if (inn.id !== activeInnings.id) return inn;
      return {
        ...inn,
        totalRuns: newTotalRuns,
        wickets: newWickets,
        overs: newOversFormatted,
        balls: updatedBalls,
      };
    });

    const updatedMatch: Match = {
      ...match,
      innings: updatedInningsList,
    };

    saveUpdatedMatch(updatedMatch);
    alert('Last ball undone successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-xs font-black uppercase">
            <Circle className="w-2.5 h-2.5 fill-current text-red-500 animate-pulse" /> Official CricValley Live Scorer
          </div>
          <h1 className="text-2xl font-heading font-black text-white mt-2">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <div className="text-xs text-slate-400">Match #{match.matchNumber} • {match.venue || 'Stadium'}</div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Admin Hub
          </Link>
          <button
            onClick={handleUndoBall}
            className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <RotateCcw className="w-4 h-4" /> Undo Ball
          </button>
        </div>
      </div>

      {/* Toss Status & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-600/40 text-amber-400 font-bold flex items-center justify-center text-lg">
            🪙
          </div>
          <div>
            <div className="text-xs text-amber-400 font-extrabold uppercase">Toss Details</div>
            <div className="text-sm font-heading font-black text-white">
              {match.tossWinnerId ? (
                <>
                  {match.tossWinnerId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name} won the toss & elected to {match.tossDecision || 'BAT'}
                </>
              ) : (
                'Toss decision pending'
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={match.tossWinnerId || match.homeTeamId}
            onChange={(e) => {
              const updatedMatch: Match = { ...match, tossWinnerId: e.target.value };
              saveUpdatedMatch(updatedMatch);
            }}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
          >
            <option value={match.homeTeamId}>Toss Winner: {match.homeTeam.name}</option>
            <option value={match.awayTeamId}>Toss Winner: {match.awayTeam.name}</option>
          </select>

          <select
            value={match.tossDecision || 'BAT'}
            onChange={(e) => {
              const updatedMatch: Match = { ...match, tossDecision: e.target.value as any };
              saveUpdatedMatch(updatedMatch);
            }}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
          >
            <option value="BAT">Elected to BAT</option>
            <option value="BOWL">Elected to BOWL</option>
          </select>
        </div>
      </div>
      {match.status === 'UPCOMING' && (
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border border-emerald-800/60 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <h3 className="text-lg font-heading font-bold text-white">Start Match Toss & 1st Innings</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => handleStartMatch('BAT')} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg">
              {match.homeTeam.name} Win Toss & BAT
            </button>
            <button onClick={() => handleStartMatch('BOWL')} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs shadow-lg">
              {match.homeTeam.name} Win Toss & BOWL
            </button>
          </div>
        </div>
      )}

      {inn1?.isCompleted && !inn2 && (
        <div className="bg-gradient-to-r from-amber-950 to-orange-950 border border-amber-800/60 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <h3 className="text-lg font-heading font-bold text-white">1st Innings Complete ({inn1.totalRuns}/{inn1.wickets})</h3>
          <p className="text-xs text-slate-300">Target for 2nd Innings: <strong className="text-amber-400 text-base font-mono">{inn1.totalRuns + 1} Runs</strong></p>
          <button onClick={handleStartSecondInnings} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg uppercase">
            Start 2nd Innings Now
          </button>
        </div>
      )}

      {/* ACTIVE SCORER CONSOLE */}
      {activeInnings && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Live Score Header */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-extrabold uppercase">
                Innings {activeInnings.inningNumber}: {activeInnings.battingTeam?.name || 'Batting Team'}
              </div>
              <div className="text-4xl font-heading font-black text-white mt-1">
                {activeInnings.totalRuns}/{activeInnings.wickets}{' '}
                <span className="text-base font-mono text-cyan-400">({activeInnings.overs} ov)</span>
              </div>
            </div>

            {activeInnings.balls && activeInnings.balls.length > 0 && (
              <BallTracker balls={activeInnings.balls.slice(-6)} />
            )}
          </div>

          {/* Players Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {/* Striker */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">Striker (Facing)</label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
              >
                {batTeamPlayers.length === 0 ? <option value="">No players added to team</option> : (
                  batTeamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (#{p.jerseyNumber || '-'})</option>
                  ))
                )}
              </select>
            </div>

            {/* Non-Striker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Non-Striker</label>
              <div className="flex gap-2">
                <select
                  value={nonStrikerId}
                  onChange={(e) => setNonStrikerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
                >
                  {batTeamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSwapStrikers}
                  title="Swap Striker & Non-Striker"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl shrink-0"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bowler */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-1">Active Bowler</label>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold"
              >
                {bowlTeamPlayers.length === 0 ? <option value="">No bowlers added to team</option> : (
                  bowlTeamPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Quick Run Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase">Runs Scored on Ball:</label>
            <div className="grid grid-cols-6 gap-3">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button
                  key={run}
                  type="button"
                  onClick={() => setSelectedRuns(run)}
                  className={`py-3.5 rounded-2xl font-black text-base transition-all border ${
                    selectedRuns === run
                      ? run === 6
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                        : run === 4
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105'
                        : 'bg-slate-700 text-white border-slate-600 scale-105'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {run}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Types */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase">Extras / Penalties:</label>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {(['NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'] as const).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setExtraType(ex)}
                  className={`py-2.5 rounded-xl font-bold border transition-all ${
                    extraType === ex
                      ? 'bg-amber-950 text-amber-400 border-amber-700 font-extrabold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {ex.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Wicket Toggle Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                setIsWicket(!isWicket);
                if (!isWicket) setShowWicketModal(true);
              }}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all ${
                isWicket
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30'
                  : 'bg-slate-950 text-red-400 border-slate-800 hover:bg-red-950/40'
              }`}
            >
              {isWicket ? `OUT (${wicketType})` : 'Mark as Wicket (OUT)'}
            </button>
          </div>

          {/* Optional Commentary */}
          <div>
            <input
              type="text"
              placeholder="Custom commentary note (optional)..."
              value={commentaryText}
              onChange={(e) => setCommentaryText(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Record Ball Submit Button */}
          <button
            type="button"
            disabled={postingBall}
            onClick={handleRecordBall}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            {postingBall ? 'Recording Ball...' : 'RECORD BALL & UPDATE SCOREBOARD'} <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      )}

      {/* Wicket Type Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-heading font-extrabold text-white">Select Wicket Dismissal Type</h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPING', 'HIT_WICKET'].map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => {
                    setWicketType(wt);
                    setShowWicketModal(false);
                  }}
                  className={`p-3 rounded-xl border text-left ${
                    wicketType === wt ? 'bg-red-950 text-red-400 border-red-700' : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  {wt.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
