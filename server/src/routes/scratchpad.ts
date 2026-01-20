import express, { Request, Response, Router } from 'express';
import * as scratchpadDb from '../db/scratchpad';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all scratchpad items
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await scratchpadDb.getScratchpadItems();
    res.json(items);
  } catch (error) {
    console.error('[Scratchpad] Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch scratchpad items' });
  }
});

// GET scratchpad item by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await scratchpadDb.getScratchpadItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Scratchpad item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('[Scratchpad] Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch scratchpad item' });
  }
});

// POST create scratchpad item
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, completed } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    const item: scratchpadDb.ScratchpadItem = {
      id: uuidv4(),
      text,
      completed: completed || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedId = await scratchpadDb.saveScratchpadItem(item);
    res.json({ success: true, id: savedId });
  } catch (error) {
    console.error('[Scratchpad] Error creating item:', error);
    res.status(500).json({ error: 'Failed to create scratchpad item' });
  }
});

// PUT update scratchpad item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { text, completed } = req.body;

    const existing = await scratchpadDb.getScratchpadItem(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Scratchpad item not found' });
    }

    const updated: scratchpadDb.ScratchpadItem = {
      ...existing,
      text: text || existing.text,
      completed: completed !== undefined ? completed : existing.completed,
      updatedAt: new Date().toISOString(),
    };

    await scratchpadDb.saveScratchpadItem(updated);
    res.json({ success: true });
  } catch (error) {
    console.error('[Scratchpad] Error updating item:', error);
    res.status(500).json({ error: 'Failed to update scratchpad item' });
  }
});

// DELETE scratchpad item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await scratchpadDb.deleteScratchpadItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Scratchpad] Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete scratchpad item' });
  }
});

export default router;
