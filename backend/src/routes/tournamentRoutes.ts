import { Router } from 'express';
import {
  getTournaments,
  getTournamentByIdOrSlug,
  createTournament,
  updateTournament,
  deleteTournament,
  addTeamsToTournament,
} from '../controllers/tournamentController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getTournaments);
router.get('/:identifier', getTournamentByIdOrSlug);

router.post('/', authenticateJwt, requireAdmin, createTournament);
router.put('/:id', authenticateJwt, requireAdmin, updateTournament);
router.delete('/:id', authenticateJwt, requireAdmin, deleteTournament);
router.post('/:id/teams', authenticateJwt, requireAdmin, addTeamsToTournament);

export default router;
