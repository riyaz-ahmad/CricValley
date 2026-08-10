import { Router } from 'express';
import {
  getMatches,
  getMatchScorecard,
  createMatch,
  bulkCreateMatches,
  autoGenerateFixtures,
  updateMatch,
  deleteMatch,
} from '../controllers/matchController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getMatches);
router.post('/bulk', authenticateJwt, requireAdmin, bulkCreateMatches);
router.post('/auto-fixtures', authenticateJwt, requireAdmin, autoGenerateFixtures);
router.get('/:id', getMatchScorecard);

router.post('/', authenticateJwt, requireAdmin, createMatch);
router.put('/:id', updateMatch);
router.delete('/:id', authenticateJwt, requireAdmin, deleteMatch);

export default router;
