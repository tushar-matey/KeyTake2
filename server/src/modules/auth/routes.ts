import { Router } from 'express';
import { getMe } from './controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.get('/me', requireAuth, getMe);

export default router;
