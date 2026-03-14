import express from 'express';
import { 
  getSceneNodes, 
  saveSceneNode, 
  deleteSceneNode,
  getUnassignedNodes
} from '../db/scene-nodes';

const router = express.Router();

// GET nodes by Chapter ID
// matches: /api/scenenodes/chapter/ch_awakening
router.get('/chapter/:chapterId', async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const nodes = await getSceneNodes(chapterId);
    res.json(nodes);
  } catch (error) {
    next(error);
  }
});

router.get('/chapter/:chapterId/:episodeId', async (req, res, next) => {
  try {
    const { chapterId, episodeId } = req.params;
    // Note: You will need to ensure your db/scene-nodes getSceneNodes function 
    // accepts a second optional argument for episodeId
    const nodes = await getSceneNodes(chapterId, episodeId); 
    res.json(nodes);
  } catch (error) {
    next(error);
  }
});

// GET unassigned nodes (for the scratchpad/sidebar)
router.get('/unassigned/:chapterId', async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const nodes = await getUnassignedNodes(chapterId);
    res.json(nodes);
  } catch (error) {
    next(error);
  }
});

// POST (Create or Update) node
router.post('/', async (req, res, next) => {
  try {
    const nodeId = await saveSceneNode(req.body);
    res.json({ id: nodeId, status: 'saved' });
  } catch (error) {
    next(error);
  }
});

// DELETE node
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteSceneNode(req.params.id);
    res.json({ status: 'deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;