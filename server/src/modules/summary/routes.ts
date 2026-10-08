import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { getSummary } from './controller';

export const summaryRouter = Router({ mergeParams: true });

summaryRouter.use(requireAuth);

// Both GET and POST route to the same handler which uses cache or generates it
summaryRouter.get('/', getSummary);
summaryRouter.post('/', getSummary);
