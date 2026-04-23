import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { updateProfileSchema, updatePreferencesSchema } from './users.schemas.js';
import * as usersController from './users.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', usersController.getMeHandler);
router.put('/me/profile', validateBody(updateProfileSchema), usersController.updateProfileHandler);
router.put(
  '/me/preferences',
  validateBody(updatePreferencesSchema),
  usersController.updatePreferencesHandler,
);

export default router;
