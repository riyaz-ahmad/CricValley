import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Play, RotateCcw, Shield, Check, AlertCircle, ArrowRightLeft, UserCheck, Flame, Circle } from 'lucide-react';
import { Match, Player, Innings, FormattedInnings } from '../../types';
import { apiRequest } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { BallTracker } from '../../components/BallTracker';

export const AdminScorerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();

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
    try {
      const res = await apiRequest<Match>(`/matches/${id}`);
      setMatch(res);

      const inn1 = res.formattedInnings?.find((i) => i.inningNumber === 1);
      const inn2 = res.formattedInnings?.find((i) => i.inningNumber === 2);
      const activeInn = inn2 && !inn2.isCompleted ? inn2 : inn1;

      if (activeInn) {
        const batPlayers = activeInn.battingTeam?.players || [];
        const bowlPlayers = activeInn.bowlingTeam?.players || [];

        if (batPlayers.length >= 2 && !strikerId) {
          setStrikerId(batPlayers[0].id);
          setNonStrikerId(batPlayers[1].id);
        }
        if (bowlPlayers.length > 0 && !bowlerId) {
          setBowlerId(bowlPlayers[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchData();
  }, [id]);

  if (loading || !match) {
    return <div className="py-20 text-center text-gray-400 animate-pulse">Loading Scorer Console...</div>;
  }

  const inn1 = match.formattedInnings?.find((i) => i.inningNumber === 1);
  const inn2 = match.formattedInnings?.find((i) => i.inningNumber === 2);
  const activeInnings = inn2 && !inn2.isCompleted ? inn2 : inn1;

  const batPlayers = activeInnings?.battingTeam?.players || [];
  const bowlPlayers = activeInnings?.bowlingTeam?.players || [];

  const handleStartMatch = async (decision: 'BAT' | 'BOWL') => {
    try {
      const tossWinnerId = match.homeTeamId;
      const battingTeamId = decision === 'BAT' ? match.homeTeamId : match.awayTeamId;
      const bowlingTeamId = decision === 'BAT' ? match.awayTeamId : match.homeTeamId;

      await apiRequest('/live/start', {
        method: 'POST',
        body: JSON.stringify({
          matchId: match.id,
          tossWinnerId,
          tossDecision: decision,
          battingTeamId,
          bowlingTeamId,
        }),
      });
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || 'Failed to start match');
    }
  };

  const handleStartSecondInnings = async () => {
    try {
      const inn1BatTeam = inn1?.battingTeamId;
      const battingTeamId = inn1BatTeam === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
      const bowlingTeamId = inn1BatTeam;

      await apiRequest('/live/start-second-innings', {
        method: 'POST',
        body: JSON.stringify({
          matchId: match.id,
          battingTeamId,
          bowlingTeamId,
        }),
      });
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || 'Failed to start 2nd innings');
    }
  };

  const handleSwapStrikers = () => {
    const temp = strikerId;
    setStrikerId(nonStrikerId);
    setNonStrikerId(temp);
  };

  const handleRecordBall = async () => {
    if (!activeInnings) return alert('No active innings available!');
    if (!strikerId || !nonStrikerId || !bowlerId) return alert('Select striker, non-striker, and bowler!');

    setPostingBall(true);
    try {
      const overNum = Math.floor(activeInnings.overs);
      const ballsInOver = Math.round((activeInnings.overs - overNum) * 10);

      await apiRequest('/live/ball', {
        method: 'POST',
        body: JSON.stringify({
          matchId: match.id,
          inningsId: activeInnings.id,
          overNumber: overNum,
          ballNumberInOver: ballsInOver + 1,
          bowlerId,
          strikerId,
          nonStrikerId,
          runs: selectedRuns,
          extraType,
          isWicket,
          wicketType: isWicket ? wicketType : undefined,
          dismissedPlayerId: isWicket ? strikerId : undefined,
          commentary: commentaryText,
        }),
      });

      // Reset selection defaults after ball
      setSelectedRuns(0);
      setExtraType('NONE');
      setIsWicket(false);
      setCommentaryText('');

      // Auto strike swap on odd runs
      if (selectedRuns % 2 !== 0) {
        handleSwapStrikers();
      }

      fetchMatchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record ball');
    } finally {
      setPostingBall(false);
    }
  };

  const handleUndoBall = async () => {
    if (!activeInnings) return;
    try {
      await apiRequest('/live/undo', {
        method: 'POST',
        body: JSON.stringify({
          matchId: match.id,
          inningsId: activeInnings.id,
        }),
      });
      fetchMatchData();
    } catch (err: any) {
      alert(err.message || 'Failed to undo ball');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Circle className="w-2.5 h-2.5 fill-current text-red-500 animate-pulse" /> Official Live Scorer Console
          </div>
          <h1 className="text-2xl font-heading font-black text-white mt-1">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </h1>
          <div className="text-xs text-gray-400">Match #{match.matchNumber} • {match.venue}</div>
        </div>

        <button
          onClick={handleUndoBall}
          className="px-4 py-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Undo Ball
        </button>
      </div>

      {/* Match Setup Controls (If UPCOMING or Innings Break) */}
      {match.status === 'UPCOMING' && (
        <div className="bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-800/60 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <h3 className="text-lg font-heading font-bold text-white">Start Match Toss & Innings 1</h3>
          <div className="flex justify-center gap-4">
            <button onClick={() => handleStartMatch('BAT')} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg">
              {match.homeTeam.shortName} Win Toss & BAT
            </button>
            <button onClick={() => handleStartMatch('BOWL')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg">
              {match.homeTeam.shortName} Win Toss & BOWL
            </button>
          </div>
        </div>
      )}

      {inn1?.isCompleted && !inn2 && (
        <div className="bg-gradient-to-r from-amber-950 to-orange-950 border border-amber-800/60 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <h3 className="text-lg font-heading font-bold text-white">1st Innings Complete ({inn1.totalRuns}/{inn1.wickets})</h3>
          <p className="text-xs text-gray-300">Target for 2nd Innings: <strong className="text-amber-400 text-base">{inn1.totalRuns + 1} Runs</strong></p>
          <button onClick={handleStartSecondInnings} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-xs shadow-lg uppercase">
            Start 2nd Innings Now
          </button>
        </div>
      )}

      {/* ACTIVE SCORER PANEL */}
      {activeInnings && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Current Score Header */}
          <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 font-semibold">Innings {activeInnings.inningNumber}: {activeInnings.battingTeam?.name}</div>
              <div className="text-3xl font-heading font-black text-white mt-1">
                {activeInnings.totalRuns}/{activeInnings.wickets} <span className="text-base font-mono text-cyan-400">({activeInnings.overs} ov)</span>
              </div>
            </div>

            {activeInnings.balls && activeInnings.balls.length > 0 && (
              <BallTracker balls={activeInnings.balls.slice(-6)} />
            )}
          </div>

          {/* Players Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-950/60 border border-gray-800 p-4 rounded-2xl">
            {/* Striker */}
            <div>
              <label className="block text-[11px] font-bold text-cyan-400 uppercase mb-1">Striker (Facing)</label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
              >
                {batPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Non-Striker */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Non-Striker</label>
              <div className="flex gap-2">
                <select
                  value={nonStrikerId}
                  onChange={(e) => setNonStrikerId(e.target.value)}
                  className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
                >
                  {batPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSwapStrikers}
                  title="Swap Striker & Non-Striker"
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-xl shrink-0"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bowler */}
            <div>
              <label className="block text-[11px] font-bold text-purple-400 uppercase mb-1">Active Bowler</label>
              <select
                value={bowlerId}
                onChange={(e) => setBowlerId(e.target.value)}
                className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white"
              >
                {bowlPlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Run Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase">Runs Scored on Ball:</label>
            <div className="grid grid-cols-6 gap-3">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button
                  key={run}
                  type="button"
                  onClick={() => setSelectedRuns(run)}
                  className={`py-3.5 rounded-2xl font-black text-base transition-all border ${
                    selectedRuns === run
                      ? run === 6
                        ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                        : run === 4
                        ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                        : 'bg-gray-700 text-white border-gray-600 scale-105'
                      : 'bg-gray-950 text-gray-300 border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  {run}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Types */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-300 uppercase">Extras / Penalties:</label>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {(['NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'] as const).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setExtraType(ex)}
                  className={`py-2.5 rounded-xl font-bold border transition-all ${
                    extraType === ex
                      ? 'bg-amber-950 text-amber-400 border-amber-700'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  {ex.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Wicket Toggle Button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsWicket(!isWicket);
                if (!isWicket) setShowWicketModal(true);
              }}
              className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all ${
                isWicket
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30'
                  : 'bg-gray-950 text-red-400 border-gray-800 hover:bg-red-950/40'
              }`}
            >
              {isWicket ? `OUT (${wicketType})` : 'Mark as Wicket (OUT)'}
            </button>
          </div>

          {/* Optional Commentary */}
          <div>
            <input
              type="text"
              placeholder="Custom ball commentary (optional)..."
              value={commentaryText}
              onChange={(e) => setCommentaryText(e.target.value)}
              className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Ball */}
          <button
            type="button"
            disabled={postingBall}
            onClick={handleRecordBall}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
          >
            {postingBall ? 'Recording Ball...' : 'RECORD BALL & BROADCAST REAL-TIME'} <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      )}

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-6 space-y-4">
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
                    wicketType === wt ? 'bg-red-950 text-red-400 border-red-700' : 'bg-gray-950 text-gray-300 border-gray-800'
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
