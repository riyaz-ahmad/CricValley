import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, Play, RotateCcw, ArrowLeft, ArrowRightLeft, Circle, CheckCircle2, Award, Zap } from 'lucide-react';
import { Match, Player, Innings } from '../../types';
import { apiRequest } from '../../services/api';
import { storage, liveMatchChannel } from '../../services/storage';
import { BallTracker } from '../../components/BallTracker';
import { useSocket } from '../../context/SocketContext';

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
  const [showOverCompleteModal, setShowOverCompleteModal] = useState<boolean>(false);
  const [completedOverNumber, setCompletedOverNumber] = useState<number>(0);

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');
  const [commentaryText, setCommentaryText] = useState<string>('');
  const [postingBall, setPostingBall] = useState<boolean>(false);

  const fetchMatchData = async () => {
    if (!id) return;
    setLoading(true);
    let foundMatch: Match | null = null;
    const allLocalMatches = storage.getMatches();
    const localMatch = allLocalMatches.find((m) => m.id === id) || null;

    try {
      const resMatch = await apiRequest<Match>(`/matches/${id}`);
      const localBallsCount = localMatch?.innings?.reduce((acc, inn) => acc + (inn.balls?.length || 0), 0) || 0;
      const resBallsCount = resMatch?.innings?.reduce((acc, inn) => acc + (inn.balls?.length || 0), 0) || 0;

      if (localMatch && localBallsCount >= resBallsCount) {
        foundMatch = localMatch;
      } else {
        foundMatch = resMatch;
      }
    } catch (err) {
      foundMatch = localMatch;
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

      const inn1 = foundMatch.innings?.find((i) => i.inningNumber === 1);
      const inn2 = foundMatch.innings?.find((i) => i.inningNumber === 2);
      const isInn2Active = inn2 && (inn1?.isCompleted || (inn2.balls && inn2.balls.length > 0) || inn2.totalRuns > 0 || inn2.overs > 0);
      const activeInn = (isInn2Active ? inn2 : inn1) || inn1;
      if (activeInn) {
        const allStoragePlayers = storage.getPlayers();
        const teamBatPlayers = (activeInn.battingTeamId === foundMatch.homeTeamId ? foundMatch.homeTeam.players : foundMatch.awayTeam.players) || [];
        const teamBowlPlayers = (activeInn.bowlingTeamId === foundMatch.homeTeamId ? foundMatch.homeTeam.players : foundMatch.awayTeam.players) || [];

        const batPlayers = teamBatPlayers.length > 0 ? teamBatPlayers : allStoragePlayers.filter((p) => p.teamId === activeInn.battingTeamId);
        const bowlPlayers = teamBowlPlayers.length > 0 ? teamBowlPlayers : allStoragePlayers.filter((p) => p.teamId === activeInn.bowlingTeamId);

        const lastBall = activeInn.balls && activeInn.balls.length > 0 ? activeInn.balls[activeInn.balls.length - 1] : null;

        if (lastBall) {
          if (lastBall.strikerId) setStrikerId(lastBall.strikerId);
          if (lastBall.nonStrikerId) setNonStrikerId(lastBall.nonStrikerId);
          if (lastBall.bowlerId) setBowlerId(lastBall.bowlerId);
        } else {
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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatchData();
  }, [id]);

  const saveUpdatedMatch = (updatedMatch: Match) => {
    setMatch(updatedMatch);
    const allMatches = storage.getMatches();
    const exists = allMatches.some((m) => m.id === updatedMatch.id);
    const newMatches = exists
      ? allMatches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
      : [...allMatches, updatedMatch];
    storage.saveMatches(newMatches);

    const homeInn = updatedMatch.innings?.find((i) => i.battingTeamId === updatedMatch.homeTeamId);
    const awayInn = updatedMatch.innings?.find((i) => i.battingTeamId === updatedMatch.awayTeamId);

    // Sync to backend API if available
    apiRequest(`/matches/${updatedMatch.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: updatedMatch.status,
        stage: updatedMatch.stage,
        tossWinnerId: updatedMatch.tossWinnerId,
        tossDecision: updatedMatch.tossDecision,
        homeScoreRuns: homeInn?.totalRuns || 0,
        homeWickets: homeInn?.wickets || 0,
        homeOvers: homeInn?.overs || 0,
        homeBalls: homeInn?.balls || [],
        awayScoreRuns: awayInn?.totalRuns || 0,
        awayWickets: awayInn?.wickets || 0,
        awayOvers: awayInn?.overs || 0,
        awayBalls: awayInn?.balls || [],
      }),
    }).catch(() => {});

    if (socket) {
      socket.emit('match_updated', updatedMatch);
      socket.emit('ball_recorded', updatedMatch);
    }
    if (liveMatchChannel) {
      liveMatchChannel.postMessage({ type: 'MATCH_UPDATED', match: updatedMatch });
    }
    window.dispatchEvent(new Event('cricvalley_match_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  if (loading || !match) {
    return <div className="py-20 text-center text-slate-400 animate-pulse font-bold">Loading CricValley Live Scorer Console...</div>;
  }

  const allPlayers = storage.getPlayers();
  const inn1 = match.innings?.find((i) => i.inningNumber === 1);
  const inn2 = match.innings?.find((i) => i.inningNumber === 2);
  const activeInnings = (inn2 && !inn2.isCompleted ? inn2 : inn1) || inn1;

  const teamBatPlayers = (activeInnings?.battingTeamId === match.homeTeamId ? match.homeTeam.players : match.awayTeam.players) || [];
  const teamBowlPlayers = (activeInnings?.bowlingTeamId === match.homeTeamId ? match.homeTeam.players : match.awayTeam.players) || [];

  const batTeamPlayers = teamBatPlayers.length > 0 ? teamBatPlayers : allPlayers.filter((p) => p.teamId === activeInnings?.battingTeamId);
  const bowlTeamPlayers = teamBowlPlayers.length > 0 ? teamBowlPlayers : allPlayers.filter((p) => p.teamId === activeInnings?.bowlingTeamId);

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

  const handleSwapStrikers = (currStrikerId?: string, currNonStrikerId?: string) => {
    const sId = currStrikerId || strikerId || (match?.homeTeam?.players && match.homeTeam.players[0]?.id) || '';
    const nsId = currNonStrikerId || nonStrikerId || (match?.homeTeam?.players && match.homeTeam.players[1]?.id) || '';
    setStrikerId(nsId);
    setNonStrikerId(sId);
  };

    const handleRecordBall = (
    overrideRuns?: number,
    overrideExtra?: 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE',
    overrideWicket?: boolean
  ) => {
    if (match.status === 'COMPLETED') {
      return alert('This match is completed and locked. Further scoring is disabled.');
    }
    if (!activeInnings) return alert('No active innings available!');
    setPostingBall(true);

    let runs = overrideRuns !== undefined ? overrideRuns : selectedRuns;
    let currentExtraType = overrideExtra !== undefined ? overrideExtra : extraType;
    let currentIsWicket = overrideWicket !== undefined ? overrideWicket : isWicket;

    let wide = currentExtraType === 'WIDE' ? 1 : 0;
    let noBall = currentExtraType === 'NO_BALL' ? 1 : 0;
    let totalBallRuns = runs + wide + noBall;

    let isLegalBall = currentExtraType !== 'WIDE' && currentExtraType !== 'NO_BALL';

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

    let newWickets = activeInnings.wickets + (currentIsWicket ? 1 : 0);
    let newTotalRuns = activeInnings.totalRuns + totalBallRuns;

    const batTeamPlayers = (activeInnings.battingTeamId === match.homeTeamId ? match.homeTeam.players : match.awayTeam.players) || [];
    const bowlTeamPlayers = (activeInnings.bowlingTeamId === match.homeTeamId ? match.homeTeam.players : match.awayTeam.players) || [];

    const effectiveStrikerId = strikerId || batTeamPlayers[0]?.id || 'striker-1';
    const effectiveNonStrikerId = nonStrikerId || batTeamPlayers[1]?.id || batTeamPlayers[0]?.id || 'striker-2';
    const effectiveBowlerId = bowlerId || bowlTeamPlayers[0]?.id || 'bowler-1';

    const striker = allPlayers.find((p) => p.id === effectiveStrikerId) || batTeamPlayers.find((p) => p.id === effectiveStrikerId);
    const bowler = allPlayers.find((p) => p.id === effectiveBowlerId) || bowlTeamPlayers.find((p) => p.id === effectiveBowlerId);

    const ballEvent = {
      id: `ball-${Date.now()}`,
      inningsId: activeInnings.id,
      overNumber: overNum,
      ballNumberInOver: ballsInOver,
      bowlerId: effectiveBowlerId,
      strikerId: effectiveStrikerId,
      nonStrikerId: effectiveNonStrikerId,
      runs,
      extraType: currentExtraType,
      extraRuns: wide + noBall,
      isWicket: currentIsWicket,
      wicketType: currentIsWicket ? wicketType : undefined,
      commentary: commentaryText || `${runs} run${runs !== 1 ? 's' : ''} scored by ${striker?.name || 'Batsman'}`,
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

    // Auto strike swap logic
    let swapCount = 0;
    if (runs % 2 !== 0) swapCount++;
    if (isLegalBall && ballsInOver === 0 && overNum > 0) swapCount++;

    if (swapCount % 2 !== 0) {
      setStrikerId(effectiveNonStrikerId);
      setNonStrikerId(effectiveStrikerId);
    } else {
      setStrikerId(effectiveStrikerId);
      setNonStrikerId(effectiveNonStrikerId);
    }

    // Check if Over Complete (6 legal balls bowled)
    if (isLegalBall && ballsInOver === 0 && overNum > 0) {
      setCompletedOverNumber(overNum);
      setShowOverCompleteModal(true);
    }

    // Auto Match End & Victory Calculator
    const inn1 = match.innings?.find((i) => i.inningNumber === 1);
    const maxOvers = match.tournament?.overs || 20;

    if (activeInnings.inningNumber === 1) {
      // 1st Innings Completion Check
      if (newWickets >= 10 || newOversFormatted >= maxOvers) {
        updatedInningsList[0].isCompleted = true;
        updatedMatch.targetRuns = newTotalRuns + 1;
      }
    } else if (activeInnings.inningNumber === 2 && inn1) {
      // 2nd Innings Auto Victory & Summary Calculator
      const targetRuns = match.targetRuns || inn1.totalRuns + 1;
      const battingTeamName = activeInnings.battingTeam?.name || 'Batting Team';
      const bowlingTeamName = activeInnings.bowlingTeam?.name || 'Bowling Team';

      if (newTotalRuns >= targetRuns) {
        // Chasing Team Won
        updatedMatch.status = 'COMPLETED';
        updatedMatch.winnerTeamId = activeInnings.battingTeamId;
        updatedMatch.resultSummary = `${battingTeamName} won by ${10 - newWickets} wickets!`;
      } else if (newWickets >= 10 || newOversFormatted >= maxOvers) {
        if (newTotalRuns < targetRuns - 1) {
          // Defending Team Won
          updatedMatch.status = 'COMPLETED';
          updatedMatch.winnerTeamId = activeInnings.bowlingTeamId;
          updatedMatch.resultSummary = `${bowlingTeamName} won by ${targetRuns - 1 - newTotalRuns} runs!`;
        } else if (newTotalRuns === targetRuns - 1) {
          // Match Tied
          updatedMatch.status = 'COMPLETED';
          updatedMatch.resultSummary = `Match Tied! Both teams scored ${newTotalRuns} runs.`;
        }
      }
    }

    // Sync ball event to backend API
    apiRequest('/live/ball', {
      method: 'POST',
      body: JSON.stringify({
        matchId: match.id,
        inningsId: activeInnings.id,
        overNumber: overNum,
        ballNumberInOver: ballsInOver,
        bowlerId: effectiveBowlerId,
        strikerId: effectiveStrikerId,
        nonStrikerId: effectiveNonStrikerId,
        runs,
        extraType: currentExtraType,
        extraRuns: wide + noBall,
        isWicket: currentIsWicket,
        wicketType: currentIsWicket ? wicketType : undefined,
        commentary: commentaryText || `${runs} runs scored by ${striker?.name || 'Batsman'}`,
      }),
    })
      .then((res: any) => {
        if (res && res.match) {
          setMatch(res.match);
          const allMatches = storage.getMatches();
          const exists = allMatches.some((m) => m.id === res.match.id);
          const newMatches = exists
            ? allMatches.map((m) => (m.id === res.match.id ? res.match : m))
            : [...allMatches, res.match];
          storage.saveMatches(newMatches);
        }
      })
      .catch(() => {});

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

    apiRequest('/live/ball/undo', {
      method: 'POST',
      body: JSON.stringify({
        matchId: match.id,
        inningsId: activeInnings.id,
      }),
    }).catch(() => {});

    saveUpdatedMatch(updatedMatch);
    alert('Last ball undone successfully!');
  };

  // Calculate live batter & bowler stats for Admin Console
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

  const currentStrikerPlayer = allPlayers.find((p) => p.id === (strikerId || batTeamPlayers[0]?.id)) || batTeamPlayers[0];
  const currentNonStrikerPlayer = allPlayers.find((p) => p.id === (nonStrikerId || batTeamPlayers[1]?.id)) || batTeamPlayers[1];
  const currentBowlerPlayer = allPlayers.find((p) => p.id === (bowlerId || bowlTeamPlayers[0]?.id)) || bowlTeamPlayers[0];

  const currentStrikerStats = currentStrikerPlayer ? playerStatsMap[currentStrikerPlayer.id] || { runs: 0, balls: 0, fours: 0, sixes: 0 } : { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const currentNonStrikerStats = currentNonStrikerPlayer ? playerStatsMap[currentNonStrikerPlayer.id] || { runs: 0, balls: 0, fours: 0, sixes: 0 } : { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const currentBowlerStats = currentBowlerPlayer ? bowlerStatsMap[currentBowlerPlayer.id] || { balls: 0, runsConceded: 0, wickets: 0 } : { balls: 0, runsConceded: 0, wickets: 0 };

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

      {/* Completed Match Locked Banner */}
      {match.status === 'COMPLETED' && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border border-red-800/80 rounded-3xl p-6 text-center space-y-2 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-900/80 border border-red-500/50 text-red-300 text-xs font-black uppercase tracking-wider">
            🔒 MATCH COMPLETED & LOCKED
          </div>
          <h2 className="text-xl font-heading font-black text-amber-400">
            🏆 {match.resultSummary || 'Match Finished'}
          </h2>
          <p className="text-xs text-slate-300">
            Scoring controls are locked to preserve official match records.
          </p>
        </div>
      )}

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
                  onClick={() => handleSwapStrikers()}
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

          {/* 📊 LIVE INDIVIDUAL PLAYER STATS CARD (FOR ADMIN SCORER) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            {/* Striker Stats */}
            <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-extrabold uppercase">
                <span>🏏 Striker *</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  SR: {currentStrikerStats.balls > 0 ? ((currentStrikerStats.runs / currentStrikerStats.balls) * 100).toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="text-sm font-black text-white">{currentStrikerPlayer?.name || 'Striker'}</div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xl font-black text-emerald-400">
                  {currentStrikerStats.runs} <span className="text-xs text-slate-400 font-normal">({currentStrikerStats.balls}b)</span>
                </span>
                <span className="text-[11px] text-slate-300 font-bold">
                  4s: <strong className="text-white">{currentStrikerStats.fours}</strong> | 6s: <strong className="text-amber-400">{currentStrikerStats.sixes}</strong>
                </span>
              </div>
            </div>

            {/* Non-Striker Stats */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase">
                <span>🏃 Non-Striker</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  SR: {currentNonStrikerStats.balls > 0 ? ((currentNonStrikerStats.runs / currentNonStrikerStats.balls) * 100).toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="text-sm font-black text-white">{currentNonStrikerPlayer?.name || 'Non-Striker'}</div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xl font-black text-slate-200">
                  {currentNonStrikerStats.runs} <span className="text-xs text-slate-400 font-normal">({currentNonStrikerStats.balls}b)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  4s: {currentNonStrikerStats.fours} | 6s: {currentNonStrikerStats.sixes}
                </span>
              </div>
            </div>

            {/* Bowler Stats */}
            <div className="p-3 bg-slate-900 border border-cyan-500/40 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-cyan-400 font-extrabold uppercase">
                <span>⚾ Bowler</span>
                <span className="text-[10px] text-cyan-300 font-mono">
                  Econ: {currentBowlerStats.balls > 0 ? ((currentBowlerStats.runsConceded / (currentBowlerStats.balls / 6)).toFixed(2)) : '0.00'}
                </span>
              </div>
              <div className="text-sm font-black text-white">{currentBowlerPlayer?.name || 'Bowler'}</div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xl font-black text-cyan-400">
                  {currentBowlerStats.wickets}-{currentBowlerStats.runsConceded}
                </span>
                <span className="text-xs text-slate-300 font-bold">
                  ({Math.floor(currentBowlerStats.balls / 6)}.{currentBowlerStats.balls % 6} ov)
                </span>
              </div>
            </div>
          </div>

          {/* ⚡ 1-TAP QUICK SCORING KEYPAD */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-amber-400 uppercase tracking-wider">
                ⚡ 1-TAP QUICK SCORING (TAP BUTTON TO RECORD BALL)
              </label>
              <span className="text-[10px] text-slate-400 font-bold">Auto-Swaps Strike on Odd Runs & Over Completion</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
              {[0, 1, 2, 3, 4, 6].map((run) => (
                <button
                  key={run}
                  type="button"
                  disabled={postingBall}
                  onClick={() => handleRecordBall(run)}
                  className={`py-4 sm:py-4 rounded-2xl font-black text-lg sm:text-xl transition-all border shadow-md active:scale-95 flex flex-col items-center justify-center ${
                    run === 6
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/30'
                      : run === 4
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-500/30'
                      : run === 0
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                  }`}
                >
                  <span>{run}</span>
                  <span className="text-[9px] font-bold uppercase opacity-80 mt-0.5">
                    {run === 0 ? 'Dot' : run === 4 ? 'FOUR' : run === 6 ? 'SIX' : `${run} Run`}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Extras & Wicket Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-2">
              <button
                type="button"
                disabled={postingBall}
                onClick={() => handleRecordBall(0, 'WIDE')}
                className="py-3 rounded-xl font-black bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 shadow"
              >
                +1 WIDE
              </button>
              <button
                type="button"
                disabled={postingBall}
                onClick={() => handleRecordBall(0, 'NO_BALL')}
                className="py-3 rounded-xl font-black bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 shadow"
              >
                +1 NO BALL
              </button>
              <button
                type="button"
                disabled={postingBall}
                onClick={() => handleRecordBall(1, 'BYE')}
                className="py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                1 BYE
              </button>
              <button
                type="button"
                disabled={postingBall}
                onClick={() => handleRecordBall(1, 'LEG_BYE')}
                className="py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                1 LEG BYE
              </button>
              <button
                type="button"
                disabled={postingBall}
                onClick={() => {
                  setIsWicket(true);
                  setShowWicketModal(true);
                }}
                className="py-3 rounded-xl font-black bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-md col-span-2 sm:col-span-1"
              >
                OUT (WICKET) 🚨
              </button>
            </div>
          </div>

          {/* Custom Ball Builder / Optional Note */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-3 text-xs">
            <input
              type="text"
              placeholder="Custom commentary note (optional)..."
              value={commentaryText}
              onChange={(e) => setCommentaryText(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            {isWicket && (
              <span className="px-3 py-2 bg-red-950 text-red-300 font-bold rounded-xl border border-red-800 shrink-0">
                Wicket: {wicketType}
              </span>
            )}
          </div>
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

      {/* End-of-Over Bowler Selector Modal */}
      {showOverCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-600/40 text-amber-400 font-bold flex items-center justify-center text-lg">
                ⚾
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Over {completedOverNumber} Complete!</span>
                <h3 className="text-base font-heading font-black text-white">Select Bowler for Over {completedOverNumber + 1}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400">Select the bowler who will bowl the next over from the list below:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bowlTeamPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setBowlerId(player.id);
                    setShowOverCompleteModal(false);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                    bowlerId === player.id
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-mono">
                      #{player.jerseyNumber || '-'}
                    </span>
                    {player.name}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-normal uppercase">{player.bowlingStyle || 'Bowler'}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowOverCompleteModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs"
            >
              Keep Current Bowler ({bowlTeamPlayers.find((p) => p.id === bowlerId)?.name || 'Bowler'})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
