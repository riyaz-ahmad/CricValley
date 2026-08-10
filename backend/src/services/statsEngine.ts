import { prisma } from '../config/prisma';

export async function getTournamentStats(tournamentId: string) {
  // Get all matches for tournament
  const matches = await prisma.match.findMany({
    where: { tournamentId },
    select: { id: true },
  });
  const matchIds = matches.map((m) => m.id);

  // Get all innings
  const inningsList = await prisma.innings.findMany({
    where: { matchId: { in: matchIds } },
    include: {
      battingTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      bowlingTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
    },
  });

  const inningsIds = inningsList.map((i) => i.id);

  // Get all ball events
  const balls = await prisma.ballEvent.findMany({
    where: { inningsId: { in: inningsIds } },
    include: {
      striker: { select: { id: true, name: true, photoUrl: true, teamId: true } },
      bowler: { select: { id: true, name: true, photoUrl: true, teamId: true } },
    },
  });

  // Calculate Batsmen Leaderboard
  const batsmenMap = new Map<string, {
    id: string;
    name: string;
    photoUrl?: string | null;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    inningsCount: number;
    outs: number;
    highestScore: number;
  }>();

  // Calculate Bowlers Leaderboard
  const bowlersMap = new Map<string, {
    id: string;
    name: string;
    photoUrl?: string | null;
    wickets: number;
    runsConceded: number;
    legalBalls: number;
  }>();

  for (const b of balls) {
    // Batsman stats
    if (b.strikerId && b.striker) {
      if (!batsmenMap.has(b.strikerId)) {
        batsmenMap.set(b.strikerId, {
          id: b.striker.id,
          name: b.striker.name,
          photoUrl: b.striker.photoUrl,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          inningsCount: 0,
          outs: 0,
          highestScore: 0,
        });
      }

      const batStat = batsmenMap.get(b.strikerId)!;
      if (b.extraType !== 'WIDE') {
        batStat.balls += 1;
      }
      batStat.runs += b.runs;
      if (b.runs === 4) batStat.fours += 1;
      if (b.runs === 6) batStat.sixes += 1;
    }

    // Bowler stats
    if (b.bowlerId && b.bowler) {
      if (!bowlersMap.has(b.bowlerId)) {
        bowlersMap.set(b.bowlerId, {
          id: b.bowler.id,
          name: b.bowler.name,
          photoUrl: b.bowler.photoUrl,
          wickets: 0,
          runsConceded: 0,
          legalBalls: 0,
        });
      }

      const bowlStat = bowlersMap.get(b.bowlerId)!;
      if (b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL') {
        bowlStat.legalBalls += 1;
      }
      if (b.extraType === 'NONE' || b.extraType === 'WIDE' || b.extraType === 'NO_BALL') {
        bowlStat.runsConceded += b.runs + b.extraRuns;
      }
      if (b.isWicket && b.wicketType !== 'RUN_OUT' && b.wicketType !== 'RETIRED') {
        bowlStat.wickets += 1;
      }
    }
  }

  // Count wickets/outs for batsmen
  for (const b of balls) {
    if (b.isWicket && b.dismissedPlayerId && batsmenMap.has(b.dismissedPlayerId)) {
      batsmenMap.get(b.dismissedPlayerId)!.outs += 1;
    }
  }

  // Format Top Batsmen (Orange Cap)
  const topBatsmen = Array.from(batsmenMap.values())
    .map((b) => ({
      ...b,
      strikeRate: b.balls > 0 ? Number(((b.runs / b.balls) * 100).toFixed(1)) : 0,
      average: b.outs > 0 ? Number((b.runs / b.outs).toFixed(1)) : b.runs,
    }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10);

  // Format Top Bowlers (Purple Cap)
  const topBowlers = Array.from(bowlersMap.values())
    .map((b) => {
      const overs = b.legalBalls / 6;
      return {
        ...b,
        overs: Number(overs.toFixed(1)),
        economy: overs > 0 ? Number((b.runsConceded / overs).toFixed(2)) : 0,
        average: b.wickets > 0 ? Number((b.runsConceded / b.wickets).toFixed(1)) : 0,
      };
    })
    .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)
    .slice(0, 10);

  // Team Highest & Lowest Scores
  const teamScores = inningsList.map((inn) => ({
    team: inn.battingTeam,
    totalRuns: inn.totalRuns,
    wickets: inn.wickets,
    overs: inn.overs,
  })).sort((a, b) => b.totalRuns - a.totalRuns);

  const highestTeamScore = teamScores[0] || null;
  const lowestTeamScore = teamScores.length > 0 ? teamScores[teamScores.length - 1] : null;

  // MVP Rankings (35 points per wicket, 1 point per run, 10 bonus per 6)
  const mvpList = Array.from(batsmenMap.values()).map((bat) => {
    const bowl = bowlersMap.get(bat.id);
    const bowlWickets = bowl ? bowl.wickets : 0;
    const mvpPoints = bat.runs + bat.sixes * 10 + bowlWickets * 35;
    return {
      id: bat.id,
      name: bat.name,
      photoUrl: bat.photoUrl,
      runs: bat.runs,
      wickets: bowlWickets,
      mvpPoints,
    };
  }).sort((a, b) => b.mvpPoints - a.mvpPoints).slice(0, 10);

  return {
    topBatsmen,
    topBowlers,
    highestTeamScore,
    lowestTeamScore,
    mvpList,
  };
}
