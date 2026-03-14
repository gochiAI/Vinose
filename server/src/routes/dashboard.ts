import express, { Request, Response, Router } from 'express';
import { getDashboardStats } from '../db/dashboard.js';

const router = Router();

// GET dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    
    const stats = await getDashboardStats();
    
    res.json(stats);
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
