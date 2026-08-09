import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const truncateAllDataExceptAdmin = async (req: Request, res: Response) => {
  try {
    // Delete in reverse order of foreign key dependencies
    await prisma.ballEvent.deleteMany({});
    await prisma.innings.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.tournamentTeam.deleteMany({});
    await prisma.player.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.sponsor.deleteMany({});
    await prisma.gallery.deleteMany({});
    await prisma.tournament.deleteMany({});

    return res.json({
      message: 'Successfully truncated all tournaments, matches, teams, and players. Admin credentials preserved!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to truncate database data' });
  }
};
