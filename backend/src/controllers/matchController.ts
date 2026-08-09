import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { recalculateTournamentPointsTable } from '../services/nrrEngine';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { tournamentId, status, stage, teamId } = req.query;
    const where: any = {};

    if (tournamentId) where.tournamentId = String(tournamentId);
    if (status) where.status = String(status);
    if (stage) where.stage = String(stage);
    if (teamId) {
      where.OR = [
        { homeTeamId: String(teamId) },
        { awayTeamId: String(teamId) },
      ];
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        tournament: { select: { id: true, title: true, overs: true } },
        homeTeam: true,
        awayTeam: true,
        winnerTeam: true,
        playerOfTheMatch: true,
        innings: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
    });

    return res.json(matches);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch matches' });
  }
};

export const getMatchScorecard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
        homeTeam: { include: { players: true } },
        awayTeam: { include: { players: true } },
        winnerTeam: true,
        playerOfTheMatch: true,
        innings: {
          include: {
            battingTeam: true,
            bowlingTeam: true,
          },
          orderBy: { inningNumber: 'asc' },
        },
      },
    });

    if (!match) return res.status(404).json({ error: 'Match not found' });

    return res.json(match);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch match' });
  }
};

export const createMatch = async (req: Request, res: Response) => {
  try {
    const { tournamentId, homeTeamId, awayTeamId, stage = 'LEAGUE', matchNumber = 1, scheduledAt, venue, umpire1, umpire2, scorer } = req.body;
    if (!tournamentId || !homeTeamId || !awayTeamId || !scheduledAt) {
      return res.status(400).json({ error: 'tournamentId, homeTeamId, awayTeamId, and scheduledAt are required' });
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        homeTeamId,
        awayTeamId,
        stage,
        matchNumber: Number(matchNumber),
        scheduledAt: new Date(scheduledAt),
        venue: venue || 'Cricket Ground',
        umpire1,
        umpire2,
        scorer,
        status: 'UPCOMING',
      },
    });

    return res.status(201).json(match);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create match' });
  }
};

export const bulkCreateMatches = async (req: Request, res: Response) => {
  try {
    const { matches, tournamentId } = req.body;
    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ error: 'matches array is required' });
    }

    const created = [];
    let num = 1;
    for (const item of matches) {
      if (item.homeTeamId && item.awayTeamId) {
        const m = await prisma.match.create({
          data: {
            tournamentId: item.tournamentId || tournamentId,
            homeTeamId: item.homeTeamId,
            awayTeamId: item.awayTeamId,
            stage: item.stage || 'LEAGUE',
            matchNumber: num++,
            scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : new Date(),
            venue: item.venue || 'Stadium',
            status: 'UPCOMING',
          },
        });
        created.push(m);
      }
    }

    return res.status(201).json({ message: `Successfully created ${created.length} matches`, matches: created });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to bulk create matches' });
  }
};

export const autoGenerateFixtures = async (req: Request, res: Response) => {
  try {
    const { tournamentId, startDate, intervalHours = 24, venue } = req.body;
    if (!tournamentId) return res.status(400).json({ error: 'tournamentId is required' });

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: { include: { team: true } } },
    });

    if (!tournament || tournament.teams.length < 2) {
      return res.status(400).json({ error: 'Tournament must have at least 2 teams to generate fixtures' });
    }

    const teamIds = tournament.teams.map((t) => t.teamId);
    let matchTime = new Date(startDate || tournament.startDate);
    let matchNumber = 1;
    const createdMatches = [];

    // Round-Robin algorithm
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        const m = await prisma.match.create({
          data: {
            tournamentId,
            homeTeamId: teamIds[i],
            awayTeamId: teamIds[j],
            stage: 'LEAGUE',
            matchNumber: matchNumber++,
            scheduledAt: new Date(matchTime),
            venue: venue || tournament.ground || 'Main Stadium',
            status: 'UPCOMING',
          },
        });
        createdMatches.push(m);
        matchTime = new Date(matchTime.getTime() + Number(intervalHours) * 60 * 60 * 1000);
      }
    }

    return res.status(201).json({
      message: `Generated ${createdMatches.length} fixtures successfully`,
      fixtures: createdMatches,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate fixtures' });
  }
};

export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      scheduledAt,
      matchNumber,
      venue,
      stage,
      status,
      winnerTeamId,
      playerOfTheMatchId,
      resultSummary,
      homeScoreRuns,
      homeWickets,
      homeOvers,
      awayScoreRuns,
      awayWickets,
      awayOvers,
    } = req.body;

    const match = await prisma.match.findUnique({ where: { id }, include: { innings: true } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const updateData: any = {};
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (matchNumber) updateData.matchNumber = Number(matchNumber);
    if (venue !== undefined) updateData.venue = venue;
    if (stage !== undefined) updateData.stage = stage;
    if (status !== undefined) updateData.status = status;
    if (winnerTeamId !== undefined) updateData.winnerTeamId = winnerTeamId || null;
    if (playerOfTheMatchId !== undefined) updateData.playerOfTheMatchId = playerOfTheMatchId || null;
    if (resultSummary !== undefined) updateData.resultSummary = resultSummary;

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updateData,
    });

    if (homeScoreRuns !== undefined) {
      let inn1 = match.innings.find((i) => i.inningNumber === 1);
      if (!inn1) {
        inn1 = await prisma.innings.create({
          data: {
            matchId: id,
            inningNumber: 1,
            battingTeamId: match.homeTeamId,
            bowlingTeamId: match.awayTeamId,
            totalRuns: Number(homeScoreRuns),
            wickets: Number(homeWickets || 0),
            overs: homeOvers !== undefined ? Number(homeOvers) : 0,
            isCompleted: status === 'COMPLETED',
          },
        });
      } else {
        await prisma.innings.update({
          where: { id: inn1.id },
          data: {
            totalRuns: Number(homeScoreRuns),
            wickets: Number(homeWickets || 0),
            overs: homeOvers !== undefined ? Number(homeOvers) : 0,
            isCompleted: status === 'COMPLETED',
          },
        });
      }
    }

    if (awayScoreRuns !== undefined) {
      let inn2 = match.innings.find((i) => i.inningNumber === 2);
      if (!inn2) {
        inn2 = await prisma.innings.create({
          data: {
            matchId: id,
            inningNumber: 2,
            battingTeamId: match.awayTeamId,
            bowlingTeamId: match.homeTeamId,
            totalRuns: Number(awayScoreRuns),
            wickets: Number(awayWickets || 0),
            overs: awayOvers !== undefined ? Number(awayOvers) : 0,
            isCompleted: status === 'COMPLETED',
          },
        });
      } else {
        await prisma.innings.update({
          where: { id: inn2.id },
          data: {
            totalRuns: Number(awayScoreRuns),
            wickets: Number(awayWickets || 0),
            overs: awayOvers !== undefined ? Number(awayOvers) : 0,
            isCompleted: status === 'COMPLETED',
          },
        });
      }
    }

    if (status === 'COMPLETED') {
      await recalculateTournamentPointsTable(match.tournamentId);
    }

    return res.json(updatedMatch);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update match' });
  }
};

export const deleteMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.match.delete({ where: { id } });
    return res.json({ message: 'Match deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete match' });
  }
};
