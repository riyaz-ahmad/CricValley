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

router.post('/start', startMatch);
router.post('/start-second-innings', startSecondInnings);
router.post('/ball', postBall);
router.post('/undo', undoBall);
router.put('/status/:id', updateMatchStatus);

export default router;
