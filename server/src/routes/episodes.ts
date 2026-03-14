import { Router } from 'express';
import { getEpisodes, saveEpisode, deleteEpisode } from '../db/episodes';

const router = Router();

// GET /api/episodes/:id - Get episodes for a chapter
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Episodes API] GET / id:', id);
    const episodes = await getEpisodes(id);
    res.json(episodes);
  } catch (error) {
    console.error('[Episodes API] Get episodes error:', error);
    res.status(500).json({ error: 'Failed to get episodes' });
  }
});

// POST /api/episodes/:id - Create or update an episode
router.post('/:id', async (req, res) => {
  try {
    const episodeData = req.body;
    console.log('[Episodes API] POST /:id', episodeData);
    const episodeId = await saveEpisode(episodeData);
    res.json({ id: episodeId });
  } catch (error) {
    console.error('[Episodes API] Save episode error:', error);
    res.status(500).json({ error: 'Failed to save episode' });
  }
});

// DELETE /api/episodes/:id - Delete an episode
router.delete('/:id', async (req, res) => {
  try {
    console.log('[Episodes API] DELETE /:id', req.params.id);
    await deleteEpisode(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Episodes API] Delete episode error:', error);
    res.status(500).json({ error: 'Failed to delete episode' });
  }
});

export default router;
