import express, { Request, Response, Router } from 'express';
import * as sceneNodesDb from '../db/scene-nodes';

const router = Router();

// GET nodes for chapter
router.get('/chapter/:chapterId', async (req: Request, res: Response) => {
  try {
    console.log('[API] GET /chapter/:chapterId - chapterId:', req.params.chapterId);
    const nodes = await sceneNodesDb.getNodesForChapter(req.params.chapterId);
    console.log('[API] GET /chapter/:chapterId - returning', nodes.length, 'nodes');
    res.json(nodes);
  } catch (error) {
    console.error('[SceneNodes] Error fetching nodes:', error);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

// GET scene node by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const node = await sceneNodesDb.getSceneNode(req.params.id);
    if (!node) {
      return res.status(404).json({ error: 'Scene node not found' });
    }
    res.json(node);
  } catch (error) {
    console.error('[SceneNodes] Error fetching node:', error);
    res.status(500).json({ error: 'Failed to fetch node' });
  }
});

// POST create/update scene node
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, chapterId, title, type, script, background, bgm, sfx, flags, nextIds } = req.body;

    if (!id || !chapterId || !title) {
      return res.status(400).json({ error: 'Missing required fields: id, chapterId, title' });
    }

    const node: sceneNodesDb.SceneNode = {
      id,
      chapterId,
      title,
      type: type || 'narration',
      script: script || '',
      background: background || '',
      bgm: bgm || '',
      sfx: sfx || '',
      flags: flags || {},
      nextIds: nextIds || [],
      createdAt: '',
      updatedAt: '',
    };

    const savedId = await sceneNodesDb.saveSceneNode(node);
    res.json({ success: true, id: savedId });
  } catch (error) {
    console.error('[SceneNodes] Error saving node:', error);
    res.status(500).json({ error: 'Failed to save node' });
  }
});

// PUT update scene node
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, type, script, background, bgm, sfx, flags, nextIds } = req.body;

    const existing = await sceneNodesDb.getSceneNode(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Scene node not found' });
    }

    const updated: sceneNodesDb.SceneNode = {
      ...existing,
      title: title || existing.title,
      type: type || existing.type,
      script: script !== undefined ? script : existing.script,
      background: background !== undefined ? background : existing.background,
      bgm: bgm !== undefined ? bgm : existing.bgm,
      sfx: sfx !== undefined ? sfx : existing.sfx,
      flags: flags !== undefined ? flags : existing.flags,
      nextIds: nextIds !== undefined ? nextIds : existing.nextIds,
    };

    await sceneNodesDb.saveSceneNode(updated);
    res.json({ success: true });
  } catch (error) {
    console.error('[SceneNodes] Error updating node:', error);
    res.status(500).json({ error: 'Failed to update node' });
  }
});

// DELETE scene node
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await sceneNodesDb.deleteSceneNode(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[SceneNodes] Error deleting node:', error);
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

export default router;
