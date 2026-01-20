import express, { Request, Response, Router } from 'express';
import * as charactersDb from '../db/characters';

const router = Router();

// Get all characters
router.get('/', async (req: Request, res: Response) => {
  try {
    const characters = await charactersDb.getCharacters();
    res.json(characters);
  } catch (error) {
    console.error('[Characters API] Get all error:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get character by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const character = await charactersDb.getCharacter(req.params.id);
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }
    res.json(character);
  } catch (error) {
    console.error('[Characters API] Get one error:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Create or update character
router.post('/', async (req: Request, res: Response) => {
  try {
    const character = req.body;
    await charactersDb.saveCharacter(character);
    res.json({ success: true, id: character.id });
  } catch (error) {
    console.error('[Characters API] Save error:', error);
    res.status(500).json({ error: 'Failed to save character' });
  }
});

// Update character
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const character = { ...req.body, id: req.params.id };
    await charactersDb.saveCharacter(character);
    res.json({ success: true, id: character.id });
  } catch (error) {
    console.error('[Characters API] Update error:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// Delete character
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await charactersDb.deleteCharacter(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Characters API] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

export default router;
