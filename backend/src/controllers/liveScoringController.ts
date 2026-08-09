import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { recordBall, undoLastBall } from '../services/scoringEngine';

export const startMatch = async (req: Request, res: Response) => {
  try {
    const { matchId, tossWinnerId, tossDecision, battingTeamId, bowlingTeamId } = req.body;
    if (!matchId || !tossWinnerId || !tossDecision || !battingTeamId || !bowlingTeamId) {
      return res.status(400).json({ error: 'matchId, tossWinnerId, tossDecision, battingTeamId, and bowlingTeamId required' });
    }

    // Update match toss & status to LIVE
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        tossWinnerId,
        tossDecision,
        status: 'LIVE',
      },
    });

    // Check or Create Innings 1
    let innings1 = await prisma.innings.findFirst({
      where: { matchId, inningNumber: 1 },
    });

    if (!innings1) {
      innings1 = await prisma.innings.create({
        data: {
          matchId,
          inningNumber: 1,
          battingTeamId,
          bowlingTeamId,
        },
      });
    }

    // Socket Broadcast
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('match_status_changed', { match: updatedMatch, innings: innings1 });
    }

    return res.json({ match: updatedMatch, innings: innings1 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to start match' });
  }
};

export const startSecondInnings = async (req: Request, res: Response) => {
  try {
    const { matchId, battingTeamId, bowlingTeamId } = req.body;
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { innings: true },
    });

    if (!match) return res.status(404).json({ error: 'Match not found' });

    let innings2 = await prisma.innings.findFirst({
      where: { matchId, inningNumber: 2 },
    });

    if (!innings2) {
      innings2 = await prisma.innings.create({
        data: {
          matchId,
          inningNumber: 2,
          battingTeamId,
          bowlingTeamId,
        },
      });
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'LIVE' },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('match_status_changed', { match, innings: innings2 });
    }

    return res.json({ innings: innings2 });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to start 2nd innings' });
  }
};

export const postBall = async (req: Request, res: Response) => {
  try {
    const result = await recordBall(req.body);

    const match = await prisma.match.findUnique({
      where: { id: req.body.matchId },
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
            balls: {
              orderBy: { timestamp: 'asc' },
            },
          },
          orderBy: { inningNumber: 'asc' },
        },
      },
    });

    // Socket.IO Broadcast
    const io = req.app.get('io');
    if (io && match) {
      io.to(`match:${req.body.matchId}`).emit('match_updated', match);
      io.to(`match:${req.body.matchId}`).emit('ball_recorded', match);
    }

    return res.status(201).json({ result, match });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to record ball' });
  }
};

export const undoBall = async (req: Request, res: Response) => {
  try {
    const { inningsId, matchId } = req.body;
    if (!inningsId) return res.status(400).json({ error: 'inningsId is required' });

    const updatedInnings = await undoLastBall(inningsId);

    const io = req.app.get('io');
    if (io && matchId) {
      io.to(`match:${matchId}`).emit('match_updated', { innings: updatedInnings, undone: true });
    }

    return res.json({ message: 'Last ball undone successfully', innings: updatedInnings });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to undo ball' });
  }
};

export const updateMatchStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, winnerTeamId, playerOfTheMatchId, resultSummary } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (winnerTeamId !== undefined) data.winnerTeamId = winnerTeamId;
    if (playerOfTheMatchId !== undefined) data.playerOfTheMatchId = playerOfTheMatchId;
    if (resultSummary !== undefined) data.resultSummary = resultSummary;

    const updated = await prisma.match.update({
      where: { id },
      data,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`match:${id}`).emit('match_status_changed', { match: updated });
    }

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update match status' });
  }
};
