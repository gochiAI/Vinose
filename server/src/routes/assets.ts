import express, { Request, Response, Router } from 'express';
import * as assetsDb from '../db/assets.js';

const router = Router();

// Get all assets
router.get('/', async (req: Request, res: Response) => {
  try {
    const assets = await assetsDb.getAssets();
    res.json(assets);
  } catch (error) {
    console.error('[Assets API] Get all error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await assetsDb.getAsset(req.params.id);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(asset);
  } catch (error) {
    console.error('[Assets API] Get one error:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Create or update asset
router.post('/', async (req: Request, res: Response) => {
  try {
    const asset = req.body;
    await assetsDb.saveAsset(asset);
    res.json({ success: true, id: asset.id });
  } catch (error) {
    console.error('[Assets API] Save error:', error);
    res.status(500).json({ error: 'Failed to save asset' });
  }
});

// Update asset
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const asset = { ...req.body, id: req.params.id };
    await assetsDb.saveAsset(asset);
    res.json({ success: true, id: asset.id });
  } catch (error) {
    console.error('[Assets API] Update error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await assetsDb.deleteAsset(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Assets API] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

export default router;
