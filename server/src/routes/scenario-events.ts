import express, { Request, Response, Router } from 'express';
import * as eventsDb from '../db/scenario-events';

const router = Router();

// GET all events
router.get('/', async (req: Request, res: Response) => {
  try {
    const events = await eventsDb.getEvents();
    res.json(events);
  } catch (error) {
    console.error('[Events] Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET event by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await eventsDb.getEvent(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('[Events] Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST create/update event
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, timing, eventName, details, characters, visuals, notes, status } = req.body;

    if (!id || !timing || !eventName) {
      return res.status(400).json({ error: 'Missing required fields: id, timing, eventName' });
    }

    const event: eventsDb.ScenarioEvent = {
      id,
      timing,
      eventName,
      details: details || '',
      characters: characters || [],
      visuals: visuals || '',
      notes: notes || '',
      status: status || 'pending',
      createdAt: '',
      updatedAt: '',
    };

    const savedId = await eventsDb.saveEvent(event);
    res.json({ success: true, id: savedId });
  } catch (error) {
    console.error('[Events] Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// PUT update event
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { timing, eventName, details, characters, visuals, notes, status } = req.body;

    const existing = await eventsDb.getEvent(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated: eventsDb.ScenarioEvent = {
      ...existing,
      timing: timing || existing.timing,
      eventName: eventName || existing.eventName,
      details: details !== undefined ? details : existing.details,
      characters: characters !== undefined ? characters : existing.characters,
      visuals: visuals !== undefined ? visuals : existing.visuals,
      notes: notes !== undefined ? notes : existing.notes,
      status: status || existing.status,
    };

    await eventsDb.saveEvent(updated);
    res.json({ success: true });
  } catch (error) {
    console.error('[Events] Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await eventsDb.deleteEvent(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[Events] Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
