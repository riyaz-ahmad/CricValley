import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const getPlayers = async (req: Request, res: Response) => {
  try {
    const { teamId, role, search } = req.query;
    const where: any = {};

    if (teamId) where.teamId = String(teamId);
    if (role) where.role = String(role);
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { battingStyle: { contains: String(search) } },
        { bowlingStyle: { contains: String(search) } },
      ];
    }

    const players = await prisma.player.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(players);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch players' });
  }
};

export const getPlayerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        strikedBalls: { select: { runs: true, extraType: true } },
        bowledBalls: { select: { runs: true, extraRuns: true, extraType: true, isWicket: true, wicketType: true } },
        dismissals: { select: { id: true } },
        momMatches: { select: { id: true, matchNumber: true, stage: true, scheduledAt: true } },
      },
    });

    if (!player) return res.status(404).json({ error: 'Player not found' });

    let totalRuns = 0;
    let ballsFaced = 0;
    let fours = 0;
    let sixes = 0;

    for (const b of player.strikedBalls) {
      if (b.extraType !== 'WIDE') ballsFaced += 1;
      totalRuns += b.runs;
      if (b.runs === 4) fours += 1;
      if (b.runs === 6) sixes += 1;
    }

    const outs = player.dismissals.length;
    const battingAvg = outs > 0 ? Number((totalRuns / outs).toFixed(1)) : totalRuns;
    const strikeRate = ballsFaced > 0 ? Number(((totalRuns / ballsFaced) * 100).toFixed(1)) : 0;

    let totalWickets = 0;
    let runsConceded = 0;
    let legalBallsBowled = 0;

    for (const b of player.bowledBalls) {
      if (b.extraType !== 'WIDE' && b.extraType !== 'NO_BALL') legalBallsBowled += 1;
      if (b.extraType === 'NONE' || b.extraType === 'WIDE' || b.extraType === 'NO_BALL') {
        runsConceded += b.runs + b.extraRuns;
      }
      if (b.isWicket && b.wicketType !== 'RUN_OUT' && b.wicketType !== 'RETIRED') {
        totalWickets += 1;
      }
    }

    const oversBowled = legalBallsBowled / 6;
    const economy = oversBowled > 0 ? Number((runsConceded / oversBowled).toFixed(2)) : 0;
    const bowlingAvg = totalWickets > 0 ? Number((runsConceded / totalWickets).toFixed(1)) : 0;

    return res.json({
      ...player,
      careerStats: {
        totalRuns,
        ballsFaced,
        fours,
        sixes,
        battingAvg,
        strikeRate,
        totalWickets,
        runsConceded,
        oversBowled: Number(oversBowled.toFixed(1)),
        economy,
        bowlingAvg,
        playerOfMatchCount: player.momMatches.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch player details' });
  }
};

export const createPlayer = async (req: Request, res: Response) => {
  try {
    const { name, jerseyNumber, role = 'ALL_ROUNDER', battingStyle = 'Right-Handed', bowlingStyle = 'Right-Arm Fast', photoUrl, dob, mobile, teamId } = req.body;
    if (!name) return res.status(400).json({ error: 'Player name is required' });

    const player = await prisma.player.create({
      data: {
        name,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        role,
        battingStyle,
        bowlingStyle,
        photoUrl,
        dob: dob ? new Date(dob) : null,
        mobile,
        teamId,
      },
    });

    return res.status(201).json(player);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create player' });
  }
};

export const bulkCreatePlayers = async (req: Request, res: Response) => {
  try {
    const { players, teamId } = req.body; // Array of { name, jerseyNumber, role, battingStyle }
    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'players array is required' });
    }

    const created = [];
    for (const item of players) {
      if (item.name) {
        const p = await prisma.player.create({
          data: {
            name: item.name.trim(),
            jerseyNumber: item.jerseyNumber ? Number(item.jerseyNumber) : Math.floor(Math.random() * 99) + 1,
            role: item.role || 'ALL_ROUNDER',
            battingStyle: item.battingStyle || 'Right-Handed',
            bowlingStyle: item.bowlingStyle || 'Right-Arm Fast',
            teamId: item.teamId || teamId || null,
          },
        });
        created.push(p);
      }
    }

    return res.status(201).json({ message: `Successfully created ${created.length} players`, players: created });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to bulk create players' });
  }
};

export const updatePlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.jerseyNumber) data.jerseyNumber = Number(data.jerseyNumber);
    if (data.dob) data.dob = new Date(data.dob);

    const player = await prisma.player.update({
      where: { id },
      data,
    });

    return res.json(player);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update player' });
  }
};

export const deletePlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.player.delete({ where: { id } });
    return res.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete player' });
  }
};
