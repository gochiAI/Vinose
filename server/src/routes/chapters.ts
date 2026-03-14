import express, { Request, Response, Router } from 'express';
import * as chaptersDb from '../db/chapters';
import type { Chapter } from '../types';

const router = Router();

// GET all chapters
router.get('/', async (req: Request, res: Response) => {
  try {
    const chapters = await chaptersDb.getChapters();
    res.json(chapters);
  } catch (error) {
    console.error('[Chapters] Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// GET chapter by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const chapter = await chaptersDb.getChapter(req.params.id);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    console.error('[Chapters] Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

// POST create/update chapter
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, title, sceneCount, status } = req.body;

    if (!id || !title) {
      return res.status(400).json({ error: 'Missing required fields: id, title' });
    }

    const chapter: Chapter = {
      id,
      title,
      sceneCount: sceneCount || 0,
      status: status || 'draft',
      createdAt: '',
      updatedAt: '',
    };

    const savedId = await chaptersDb.saveChapter(chapter);
    res.json({ success: true, id: savedId });
  } catch (error) {
    console.error('[Chapters] Error saving chapter:', error);
    res.status(500).json({ error: 'Failed to save chapter' });
  }
});

// PUT update chapter
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, sceneCount, status } = req.body;

    const existing = await chaptersDb.getChapter(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const updated: Chapter = {
      ...existing,
      title: title || existing.title,
      sceneCount: sceneCount !== undefined ? sceneCount : existing.sceneCount,
      status: status || existing.status,
    };

    await chaptersDb.saveChapter(updated);
    res.json({ success: true });
  } catch (error) {
    console.error('[Chapters] Error updating chapter:', error);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// DELETE chapter
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await chaptersDb.deleteChapter(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Chapters] Error deleting chapter:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

export default router;
