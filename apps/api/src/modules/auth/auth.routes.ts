import { Router } from 'express';
import { validateBody } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema, logoutSchema, refreshSchema } from './auth.schemas.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.registerHandler);
router.post('/login', validateBody(loginSchema), authController.loginHandler);
router.post('/logout', validateBody(logoutSchema), authController.logoutHandler);
router.post('/refresh', validateBody(refreshSchema), authController.refreshHandler);

export default router;
