import { Request, Response } from 'express';
import { getTournamentStats } from '../services/statsEngine';
import { recalculateTournamentPointsTable } from '../services/nrrEngine';

export const getStats = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const stats = await getTournamentStats(tournamentId);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tournament statistics' });
  }
};

export const recalculatePointsTable = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    await recalculateTournamentPointsTable(tournamentId);
    return res.json({ message: 'Points table and NRR recalculated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to recalculate points table' });
  }
};
