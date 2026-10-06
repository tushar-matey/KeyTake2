import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as uploadController from './controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/upload-url', uploadController.getUploadUrl);
router.post('/complete-upload', uploadController.finishUpload);

export default router;
