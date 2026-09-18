import { Router } from 'express';
import { loginHandler, meHandler, logoutHandler } from './auth.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';

const router = Router();

// Public login endpoint
router.post('/login', loginHandler);

// Protected session inspection
router.get('/me', authenticateToken, meHandler);

// Protected logout endpoint
router.post('/logout', authenticateToken, logoutHandler);

export const authRouter = router;
