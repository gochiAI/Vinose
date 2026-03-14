import express, { Request, Response, Router } from 'express';
import * as projectDb from '../db/project-info';

const router = Router();

// GET project info
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[API] GET /project-info');
    const projectInfo = await projectDb.getProjectInfo();
    res.json(projectInfo || { id: '', name: 'Untitled Project', description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[ProjectInfo] Error fetching project info:', error);
    res.status(500).json({ error: 'Failed to fetch project info' });
  }
});

// PUT project info
router.put('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    console.log('[API] PUT /project-info - name:', name);
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const projectInfo = await projectDb.updateProjectInfo(name, description);
    res.json(projectInfo);
  } catch (error) {
    console.error('[ProjectInfo] Error updating project info:', error);
    res.status(500).json({ error: 'Failed to update project info' });
  }
});

export default router;
