import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  bulkCreateTeams,
  updateTeam,
  deleteTeam,
} from '../controllers/teamController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTeams);
router.post('/bulk', authenticateJwt, requireAdmin, bulkCreateTeams);
router.get('/:id', getTeamById);

router.post('/', authenticateJwt, requireAdmin, createTeam);
router.put('/:id', authenticateJwt, requireAdmin, updateTeam);
router.delete('/:id', authenticateJwt, requireAdmin, deleteTeam);

export default router;
