import { prisma } from '../config/prisma';

/**
 * Converts overs (e.g. 19.4) into total legal balls (19 * 6 + 4 = 118)
 */
export function oversToBalls(overs: number): number {
  const fullOvers = Math.floor(overs);
  const extraBalls = Math.round((overs - fullOvers) * 10);
  return fullOvers * 6 + extraBalls;
}

/**
 * Converts total legal balls into standard cricket overs decimal (118 -> 19.4)
 */
export function ballsToOvers(balls: number): number {
  const fullOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return Number(`${fullOvers}.${remainingBalls}`);
}

/**
 * Recalculates points table and NRR for all teams in a given tournament.
 */
export async function recalculateTournamentPointsTable(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { teams: true },
  });

  if (!tournament) return;

  const completedMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: 'COMPLETED',
    },
    include: {
      innings: true,
    },
  });

  const teamStatsMap = new Map<string, {
    matchesPlayed: number;
    wins: number;
    losses: number;
    ties: number;
    noResults: number;
    points: number;
    runsScored: number;
    ballsFaced: number;
    runsConceded: number;
    ballsBowled: number;
  }>();

  // Initialize stats for each participating team
  for (const tt of tournament.teams) {
    teamStatsMap.set(tt.teamId, {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      points: 0,
      runsScored: 0,
      ballsFaced: 0,
      runsConceded: 0,
      ballsBowled: 0,
    });
  }

  for (const match of completedMatches) {
    const homeStats = teamStatsMap.get(match.homeTeamId);
    const awayStats = teamStatsMap.get(match.awayTeamId);

    if (homeStats) homeStats.matchesPlayed += 1;
    if (awayStats) awayStats.matchesPlayed += 1;

    if (match.winnerTeamId) {
      if (homeStats && match.winnerTeamId === match.homeTeamId) {
        homeStats.wins += 1;
        homeStats.points += 2;
      } else if (homeStats) {
        homeStats.losses += 1;
      }

      if (awayStats && match.winnerTeamId === match.awayTeamId) {
        awayStats.wins += 1;
        awayStats.points += 2;
      } else if (awayStats) {
        awayStats.losses += 1;
      }
    } else if (match.resultSummary && match.resultSummary.toLowerCase().includes('tie')) {
      if (homeStats) { homeStats.ties += 1; homeStats.points += 1; }
      if (awayStats) { awayStats.ties += 1; awayStats.points += 1; }
    } else {
      if (homeStats) { homeStats.noResults += 1; homeStats.points += 1; }
      if (awayStats) { awayStats.noResults += 1; awayStats.points += 1; }
    }

    // Process NRR details from Innings
    for (const inn of match.innings) {
      const batStats = teamStatsMap.get(inn.battingTeamId);
      const bowlStats = teamStatsMap.get(inn.bowlingTeamId);

      // If team was all out (10 wickets), count full match overs (e.g. 20 overs = 120 balls)
      let effectiveBallsFaced = oversToBalls(inn.overs);
      if (inn.wickets >= 10) {
        effectiveBallsFaced = tournament.overs * 6;
      }

      if (batStats) {
        batStats.runsScored += inn.totalRuns;
        batStats.ballsFaced += effectiveBallsFaced;
      }

      if (bowlStats) {
        bowlStats.runsConceded += inn.totalRuns;
        bowlStats.ballsBowled += effectiveBallsFaced;
      }
    }
  }

  // Update Database records
  for (const [teamId, stats] of teamStatsMap.entries()) {
    const oversFacedFloat = stats.ballsFaced / 6;
    const oversBowledFloat = stats.ballsBowled / 6;

    const forRunRate = oversFacedFloat > 0 ? stats.runsScored / oversFacedFloat : 0;
    const againstRunRate = oversBowledFloat > 0 ? stats.runsConceded / oversBowledFloat : 0;
    const netRunRate = Number((forRunRate - againstRunRate).toFixed(3));

    await prisma.tournamentTeam.updateMany({
      where: { tournamentId, teamId },
      data: {
        matchesPlayed: stats.matchesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        noResults: stats.noResults,
        points: stats.points,
        netRunRate,
        runsScored: stats.runsScored,
        oversFaced: ballsToOvers(stats.ballsFaced),
        runsConceded: stats.runsConceded,
        oversBowled: ballsToOvers(stats.ballsBowled),
      },
    });
  }
}
