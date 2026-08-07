import { Router } from 'express';
import authRoutes from './authRoutes';
import tournamentRoutes from './tournamentRoutes';
import teamRoutes from './teamRoutes';
import playerRoutes from './playerRoutes';
import matchRoutes from './matchRoutes';
import liveScoringRoutes from './liveScoringRoutes';
import statsRoutes from './statsRoutes';
import extraRoutes from './extraRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/live', liveScoringRoutes);
router.use('/stats', statsRoutes);
router.use('/extra', extraRoutes);

export default router;
