import { Router } from 'express';
import { chatStream, getHistory } from './controller';
import { requireAuth } from '../../middleware/requireAuth';

export const chatRouter = Router();

chatRouter.post('/:id/chat', requireAuth, chatStream);
chatRouter.get('/:id/chat/history', requireAuth, getHistory);
