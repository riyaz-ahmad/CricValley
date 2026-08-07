import { Router } from 'express';
import {
  globalSearch,
  createAnnouncement,
  deleteAnnouncement,
  createSponsor,
  deleteSponsor,
  createGalleryItem,
  deleteGalleryItem,
} from '../controllers/extraController';
import { authenticateJwt, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/search', globalSearch);

router.post('/announcements', authenticateJwt, requireAdmin, createAnnouncement);
router.delete('/announcements/:id', authenticateJwt, requireAdmin, deleteAnnouncement);

router.post('/sponsors', authenticateJwt, requireAdmin, createSponsor);
router.delete('/sponsors/:id', authenticateJwt, requireAdmin, deleteSponsor);

router.post('/gallery', authenticateJwt, requireAdmin, createGalleryItem);
router.delete('/gallery/:id', authenticateJwt, requireAdmin, deleteGalleryItem);

export default router;
