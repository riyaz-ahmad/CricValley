import { prisma } from '../config/prisma';
import { oversToBalls, ballsToOvers, recalculateTournamentPointsTable } from './nrrEngine';

export interface RecordBallInput {
  matchId: string;
  inningsId: string;
  overNumber: number;
  ballNumberInOver: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runs: number;
  extraType?: 'NONE' | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE';
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: string;
  dismissedPlayerId?: string;
  fielderId?: string;
  commentary?: string;
  wagonWheelAngle?: number;
  wagonWheelZone?: string;
}

export async function recordBall(input: RecordBallInput) {
  const {
    matchId,
    inningsId,
    overNumber,
    ballNumberInOver,
    bowlerId,
    strikerId,
    nonStrikerId,
    runs,
    extraType = 'NONE',
    extraRuns = 0,
    isWicket = false,
    wicketType,
    dismissedPlayerId,
    fielderId,
    commentary,
    wagonWheelAngle,
    wagonWheelZone,
  } = input;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      innings: {
        orderBy: { inningNumber: 'asc' },
      },
    },
  });

  if (!match) throw new Error('Match not found');

  const currentInnings = await prisma.innings.findUnique({
    where: { id: inningsId },
  });

  if (!currentInnings) throw new Error('Innings not found');

  // Calculate total runs for this ball
  const isWide = extraType === 'WIDE';
  const isNoBall = extraType === 'NO_BALL';
  const isExtra = isWide || isNoBall || extraType === 'BYE' || extraType === 'LEG_BYE';
  
  // Total score addition for the ball
  let ballTotalRuns = runs + extraRuns;
  if (isWide || isNoBall) {
    ballTotalRuns += 1; // standard penalty run for wide/no ball
  }

  // Save the ball event
  const newBall = await prisma.ballEvent.create({
    data: {
      inningsId,
      overNumber,
      ballNumberInOver,
      bowlerId,
      strikerId,
      nonStrikerId,
      runs,
      extraType,
      extraRuns: isWide || isNoBall ? extraRuns + 1 : extraRuns,
      isWicket: !!isWicket,
      wicketType,
      dismissedPlayerId,
      fielderId,
      commentary: commentary || generateAutoCommentary(input, ballTotalRuns),
      wagonWheelAngle,
      wagonWheelZone,
    },
  });

  // Calculate new Innings summary metrics
  const newTotalRuns = currentInnings.totalRuns + ballTotalRuns;
  const newWickets = isWicket ? currentInnings.wickets + 1 : currentInnings.wickets;

  let newWideExtras = currentInnings.wideExtras;
  let newNoBallExtras = currentInnings.noBallExtras;
  let newByeExtras = currentInnings.byeExtras;
  let newLegByeExtras = currentInnings.legByeExtras;

  if (isWide) newWideExtras += (1 + extraRuns);
  if (isNoBall) newNoBallExtras += (1 + extraRuns);
  if (extraType === 'BYE') newByeExtras += (runs + extraRuns);
  if (extraType === 'LEG_BYE') newLegByeExtras += (runs + extraRuns);

  // Legal ball count update (wide & noball do not increment legal balls)
  const currentLegalBalls = oversToBalls(currentInnings.overs);
  const newLegalBalls = (isWide || isNoBall) ? currentLegalBalls : currentLegalBalls + 1;
  const newOvers = ballsToOvers(newLegalBalls);

  const isMaxOversReached = newLegalBalls >= match.tournament.overs * 6;
  const isAllOut = newWickets >= 10;
  const isInningsComplete = isMaxOversReached || isAllOut;

  // Update current innings in DB
  const updatedInnings = await prisma.innings.update({
    where: { id: inningsId },
    data: {
      totalRuns: newTotalRuns,
      wickets: newWickets,
      overs: newOvers,
      wideExtras: newWideExtras,
      noBallExtras: newNoBallExtras,
      byeExtras: newByeExtras,
      legByeExtras: newLegByeExtras,
      isCompleted: isInningsComplete,
    },
  });

  // Check 2nd Innings Target & Match Win Status
  if (currentInnings.inningNumber === 1 && isInningsComplete) {
    // Set match target
    await prisma.match.update({
      where: { id: matchId },
      data: {
        targetRuns: newTotalRuns + 1,
        status: 'PAUSED', // Paused for innings break
      },
    });
  } else if (currentInnings.inningNumber === 2) {
    const target = match.targetRuns || 0;
    const firstInnings = match.innings.find((i) => i.inningNumber === 1);

    if (newTotalRuns >= target) {
      // Team 2 Won!
      const winningTeamId = currentInnings.battingTeamId;
      const wicketsLeft = 10 - newWickets;
      const resultSummary = `${winningTeamId === match.homeTeamId ? match.homeTeamId : match.awayTeamId} won by ${wicketsLeft} wickets`;

      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          winnerTeamId: winningTeamId,
          resultSummary,
        },
      });

      await recalculateTournamentPointsTable(match.tournamentId);
    } else if (isInningsComplete) {
      // Innings finished without reaching target
      let winningTeamId: string | null = null;
      let resultSummary = '';

      if (newTotalRuns === target - 1) {
        resultSummary = 'Match Tied';
      } else {
        winningTeamId = currentInnings.bowlingTeamId;
        const marginRuns = (firstInnings?.totalRuns || 0) - newTotalRuns;
        resultSummary = `${winningTeamId === match.homeTeamId ? match.homeTeamId : match.awayTeamId} won by ${marginRuns} runs`;
      }

      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          winnerTeamId: winningTeamId,
          resultSummary,
        },
      });

      await recalculateTournamentPointsTable(match.tournamentId);
    }
  }

  return {
    ball: newBall,
    innings: updatedInnings,
  };
}

export async function undoLastBall(inningsId: string) {
  const lastBall = await prisma.ballEvent.findFirst({
    where: { inningsId },
    orderBy: { timestamp: 'desc' },
  });

  if (!lastBall) throw new Error('No balls to undo');

  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
  });

  if (!innings) throw new Error('Innings not found');

  const isWide = lastBall.extraType === 'WIDE';
  const isNoBall = lastBall.extraType === 'NO_BALL';

  let ballRuns = lastBall.runs + lastBall.extraRuns;
  if (isWide || isNoBall) {
    ballRuns = lastBall.extraRuns; // already includes penalty run
  }

  const newTotalRuns = Math.max(0, innings.totalRuns - ballRuns);
  const newWickets = lastBall.isWicket ? Math.max(0, innings.wickets - 1) : innings.wickets;

  const currentBalls = oversToBalls(innings.overs);
  const newBalls = (isWide || isNoBall) ? currentBalls : Math.max(0, currentBalls - 1);
  const newOvers = ballsToOvers(newBalls);

  // Delete ball record
  await prisma.ballEvent.delete({
    where: { id: lastBall.id },
  });

  // Update Innings
  const updatedInnings = await prisma.innings.update({
    where: { id: inningsId },
    data: {
      totalRuns: newTotalRuns,
      wickets: newWickets,
      overs: newOvers,
      isCompleted: false,
    },
  });

  return updatedInnings;
}

function generateAutoCommentary(input: RecordBallInput, totalRuns: number): string {
  if (input.isWicket) {
    return `OUT! ${input.wicketType || 'Wicket'}! Big moment in the match.`;
  }
  if (input.runs === 6) {
    return `SIX! Huge hit into the stands!`;
  }
  if (input.runs === 4) {
    return `FOUR! Beautifully placed shot to the boundary line.`;
  }
  if (input.extraType === 'WIDE') {
    return `Wide ball. Extra run to the batting team.`;
  }
  if (input.extraType === 'NO_BALL') {
    return `No ball! Free hit coming up.`;
  }
  if (totalRuns === 0) {
    return `Dot ball. Crisp defense by the batsman.`;
  }
  return `${totalRuns} run${totalRuns > 1 ? 's' : ''} taken.`;
}
