import express, { Request, Response, Router } from 'express';
import * as filesDb from '../db/files';

const router = Router();

// Get all files
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await filesDb.getFiles();
    res.json(files);
  } catch (error) {
    console.error('[Files API] Get all error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get files in folder
router.get('/folder/:parentId', async (req: Request, res: Response) => {
  try {
    const parentId = req.params.parentId === 'root' ? null : req.params.parentId;
    const files = await filesDb.getFilesInFolder(parentId);
    res.json(files);
  } catch (error) {
    console.error('[Files API] Get folder error:', error);
    res.status(500).json({ error: 'Failed to fetch folder files' });
  }
});

// Get file by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const file = await filesDb.getFile(req.params.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json(file);
  } catch (error) {
    console.error('[Files API] Get one error:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Create or update file
router.post('/', async (req: Request, res: Response) => {
  try {
    const file = req.body;
    await filesDb.saveFile(file);
    res.json({ success: true, id: file.id });
  } catch (error) {
    console.error('[Files API] Save error:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Update file
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const file = { ...req.body, id: req.params.id };
    await filesDb.saveFile(file);
    res.json({ success: true, id: file.id });
  } catch (error) {
    console.error('[Files API] Update error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete file
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await filesDb.deleteFile(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Files API] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
