import { Router } from 'express';
import {
  startMatch,
  startSecondInnings,
  postBall,
  undoBall,
  updateMatchStatus,
} from '../controllers/liveScoringController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.post('/start', authenticateJwt, requireAdmin, startMatch);
router.post('/start-second-innings', authenticateJwt, requireAdmin, startSecondInnings);
router.post('/ball', authenticateJwt, requireAdmin, postBall);
router.post('/undo', authenticateJwt, requireAdmin, undoBall);
router.put('/status/:id', authenticateJwt, requireAdmin, updateMatchStatus);

export default router;
