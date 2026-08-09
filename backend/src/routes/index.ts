import { Router } from 'express';
import authRoutes from './authRoutes';
import tournamentRoutes from './tournamentRoutes';
import teamRoutes from './teamRoutes';
import playerRoutes from './playerRoutes';
import matchRoutes from './matchRoutes';
import liveScoringRoutes from './liveScoringRoutes';
import statsRoutes from './statsRoutes';
import extraRoutes from './extraRoutes';
import { truncateAllDataExceptAdmin } from '../controllers/adminCleanupController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/live', liveScoringRoutes);
router.use('/stats', statsRoutes);
router.use('/extra', extraRoutes);
router.post('/admin/reset-database', truncateAllDataExceptAdmin);

export default router;
