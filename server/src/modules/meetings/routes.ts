import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as meetingController from './controller';

// Note: upload routes will be added later by the upload module
import uploadRoutes from '../upload/routes';

const router = Router();

router.use(requireAuth);

router.post('/', meetingController.create);
router.get('/', meetingController.list);
router.get('/:id', meetingController.get);
router.get('/:id/status', meetingController.getStatus);
router.delete('/:id', meetingController.remove);

// Mount upload routes
router.use('/:id', uploadRoutes);

export default router;
