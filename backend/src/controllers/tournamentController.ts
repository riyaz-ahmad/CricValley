import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getTournaments = async (req: Request, res: Response) => {
  try {
    const { status, format, search } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (format) where.format = String(format);
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { city: { contains: String(search) } },
        { ground: { contains: String(search) } },
      ];
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { teams: true, matches: true },
        },
      },
    });

    return res.json(tournaments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tournaments' });
  }
};

export const getTournamentByIdOrSlug = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;

    const tournament = await prisma.tournament.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        teams: {
          include: {
            team: {
              include: {
                players: true,
              },
            },
          },
          orderBy: [{ points: 'desc' }, { netRunRate: 'desc' }],
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
            winnerTeam: true,
            innings: true,
          },
          orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
        },
        announcements: { orderBy: { createdAt: 'desc' } },
        sponsors: true,
        gallery: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    return res.json(tournament);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tournament details' });
  }
};

export const createTournament = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      format = 'LEAGUE',
      overs = 20,
      powerplayOvers = 6,
      ballType = 'Leather',
      ground,
      city,
      startDate,
      endDate,
      registrationDeadline,
      entryFee = 0,
      prizePool,
      logoUrl,
      bannerUrl,
      rules,
      contactEmail,
      contactPhone,
      teamIds = [],
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, startDate, and endDate are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const tournament = await prisma.tournament.create({
      data: {
        title,
        slug,
        description,
        format,
        overs: Number(overs),
        powerplayOvers: Number(powerplayOvers),
        ballType,
        ground,
        city,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        entryFee: Number(entryFee),
        prizePool,
        logoUrl,
        bannerUrl,
        rules,
        contactEmail,
        contactPhone,
        status: 'PUBLISHED',
      },
    });

    // Link teams if provided
    if (Array.isArray(teamIds) && teamIds.length > 0) {
      for (const tId of teamIds) {
        await prisma.tournamentTeam.create({
          data: {
            tournamentId: tournament.id,
            teamId: tId,
          },
        });
      }
    }

    return res.status(201).json(tournament);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create tournament' });
  }
};

export const updateTournament = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.registrationDeadline) data.registrationDeadline = new Date(data.registrationDeadline);
    if (data.overs) data.overs = Number(data.overs);
    if (data.powerplayOvers) data.powerplayOvers = Number(data.powerplayOvers);
    if (data.entryFee) data.entryFee = Number(data.entryFee);

    delete data.teamIds;

    const updated = await prisma.tournament.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update tournament' });
  }
};

export const deleteTournament = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.tournament.delete({ where: { id } });
    return res.json({ message: 'Tournament deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete tournament' });
  }
};

export const addTeamsToTournament = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teamIds } = req.body; // array of team IDs

    if (!Array.isArray(teamIds)) {
      return res.status(400).json({ error: 'teamIds must be an array' });
    }

    for (const tId of teamIds) {
      const existing = await prisma.tournamentTeam.findUnique({
        where: {
          tournamentId_teamId: { tournamentId: id, teamId: tId },
        },
      });
      if (!existing) {
        await prisma.tournamentTeam.create({
          data: { tournamentId: id, teamId: tId },
        });
      }
    }

    return res.json({ message: 'Teams assigned to tournament successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to assign teams' });
  }
};
