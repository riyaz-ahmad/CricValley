import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ tournaments: [], teams: [], players: [], matches: [] });
    }

    const query = q.trim();

    const [tournaments, teams, players, matches] = await Promise.all([
      prisma.tournament.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { city: { contains: query } },
            { ground: { contains: query } },
          ],
        },
        take: 5,
      }),
      prisma.team.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { shortName: { contains: query } },
            { city: { contains: query } },
          ],
        },
        take: 5,
      }),
      prisma.player.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { role: { contains: query } },
          ],
        },
        include: { team: true },
        take: 8,
      }),
      prisma.match.findMany({
        where: {
          OR: [
            { venue: { contains: query } },
            { homeTeam: { name: { contains: query } } },
            { awayTeam: { name: { contains: query } } },
          ],
        },
        include: { homeTeam: true, awayTeam: true, tournament: true },
        take: 5,
      }),
    ]);

    return res.json({ tournaments, teams, players, matches });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Search failed' });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { tournamentId, title, content, isImportant } = req.body;
    const ann = await prisma.announcement.create({
      data: { tournamentId, title, content, isImportant: !!isImportant },
    });
    return res.status(201).json(ann);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create announcement' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return res.json({ message: 'Announcement deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete announcement' });
  }
};

export const createSponsor = async (req: Request, res: Response) => {
  try {
    const { tournamentId, name, tier, logoUrl, websiteUrl } = req.body;
    const sponsor = await prisma.sponsor.create({
      data: { tournamentId, name, tier, logoUrl, websiteUrl },
    });
    return res.status(201).json(sponsor);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create sponsor' });
  }
};

export const deleteSponsor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sponsor.delete({ where: { id } });
    return res.json({ message: 'Sponsor deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete sponsor' });
  }
};

export const createGalleryItem = async (req: Request, res: Response) => {
  try {
    const { tournamentId, title, imageUrl, category } = req.body;
    const item = await prisma.gallery.create({
      data: { tournamentId, title, imageUrl, category: category || 'MATCH' },
    });
    return res.status(201).json(item);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to add gallery image' });
  }
};

export const deleteGalleryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.gallery.delete({ where: { id } });
    return res.json({ message: 'Gallery item deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete gallery item' });
  }
};
