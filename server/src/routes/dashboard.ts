import express, { Request, Response, Router } from 'express';
import { getDashboardStats } from '../db/dashboard';

const router = Router();

// GET dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    console.log('[Dashboard API] Fetching stats...');
    const stats = await getDashboardStats();
    console.log('[Dashboard API] Stats retrieved:', stats);
    res.json(stats);
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
