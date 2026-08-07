import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getTeams = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { shortName: { contains: String(search) } },
        { city: { contains: String(search) } },
      ];
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        _count: {
          select: { players: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(teams);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch teams' });
  }
};

export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: { orderBy: { name: 'asc' } },
        tournamentTeams: {
          include: { tournament: true },
        },
        homeMatches: {
          include: { homeTeam: true, awayTeam: true, winnerTeam: true },
          take: 5,
          orderBy: { scheduledAt: 'desc' },
        },
        awayMatches: {
          include: { homeTeam: true, awayTeam: true, winnerTeam: true },
          take: 5,
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    if (!team) return res.status(404).json({ error: 'Team not found' });

    const statsSummary = team.tournamentTeams.reduce(
      (acc, curr) => {
        acc.matchesPlayed += curr.matchesPlayed;
        acc.wins += curr.wins;
        acc.losses += curr.losses;
        acc.ties += curr.ties;
        acc.noResults += curr.noResults;
        acc.points += curr.points;
        return acc;
      },
      { matchesPlayed: 0, wins: 0, losses: 0, ties: 0, noResults: 0, points: 0 }
    );

    return res.json({
      ...team,
      statsSummary,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch team details' });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, shortName, logoUrl, bannerUrl, city, foundedYear, captainName, viceCaptain, coachName, managerName, bio } = req.body;
    if (!name || !shortName) {
      return res.status(400).json({ error: 'Team name and short name are required' });
    }

    const team = await prisma.team.create({
      data: {
        name,
        shortName: shortName.toUpperCase(),
        logoUrl,
        bannerUrl,
        city,
        foundedYear: foundedYear ? Number(foundedYear) : null,
        captainName,
        viceCaptain,
        coachName,
        managerName,
        bio,
      },
    });

    return res.status(201).json(team);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create team' });
  }
};

export const bulkCreateTeams = async (req: Request, res: Response) => {
  try {
    const { teams } = req.body; // Array of { name, shortName, city, captainName }
    if (!Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ error: 'teams array is required' });
    }

    const created = [];
    for (const item of teams) {
      if (item.name && item.shortName) {
        const t = await prisma.team.create({
          data: {
            name: item.name.trim(),
            shortName: item.shortName.trim().toUpperCase(),
            city: item.city ? item.city.trim() : null,
            captainName: item.captainName ? item.captainName.trim() : null,
          },
        });
        created.push(t);
      }
    }

    return res.status(201).json({ message: `Successfully created ${created.length} teams`, teams: created });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to bulk create teams' });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.shortName) data.shortName = data.shortName.toUpperCase();
    if (data.foundedYear) data.foundedYear = Number(data.foundedYear);

    const team = await prisma.team.update({
      where: { id },
      data,
    });

    return res.json(team);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update team' });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.team.delete({ where: { id } });
    return res.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete team' });
  }
};
