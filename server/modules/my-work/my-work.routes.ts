import { Router } from 'express';
import { getMyWorkHandler } from './my-work.controller.ts';
import { authenticateToken } from '../../middlewares/authenticate.ts';

const router = Router();

// Requires authentication
router.use(authenticateToken);

// GET /api/v1/my-work - aggregated developer workspace feed
router.get('/', getMyWorkHandler);

export const myWorkRouter = router;
