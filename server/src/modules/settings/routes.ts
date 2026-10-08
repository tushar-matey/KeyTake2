import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { deleteAccountHandler } from './controller';

const router = Router();

router.delete('/account', requireAuth, deleteAccountHandler);

export const settingsRouter = router;
