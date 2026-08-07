import { Router } from 'express';
import {
  getPlayers,
  getPlayerById,
  createPlayer,
  bulkCreatePlayers,
  updatePlayer,
  deletePlayer,
} from '../controllers/playerController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getPlayers);
router.post('/bulk', authenticateJwt, requireAdmin, bulkCreatePlayers);
router.get('/:id', getPlayerById);

router.post('/', authenticateJwt, requireAdmin, createPlayer);
router.put('/:id', authenticateJwt, requireAdmin, updatePlayer);
router.delete('/:id', authenticateJwt, requireAdmin, deletePlayer);

export default router;
