import { Router } from 'express';
import { chatStream, getHistory } from './controller';
import { requireAuth } from '../../middleware/requireAuth';
import { chatLimiter } from '../../middleware/rateLimiter';

export const chatRouter = Router();

chatRouter.post('/:id/chat', requireAuth, chatLimiter, chatStream);
chatRouter.get('/:id/chat/history', requireAuth, getHistory);
