import { Router } from 'express';
import { getStats, recalculatePointsTable } from '../controllers/statsController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/:tournamentId', getStats);
router.post('/:tournamentId/recalculate', authenticateJwt, requireAdmin, recalculatePointsTable);

export default router;
