import { db } from './connection';

export interface ScenarioEvent {
  id: string;
  timing: string;
  eventName: string;
  details: string;
  characters: string[];
  visuals: string;
  notes: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export async function getEvents(): Promise<ScenarioEvent[]> {
  const rows = await db.all(`
    SELECT id, timing, event_name, details, characters, visuals, notes, status, created_at, updated_at
    FROM scenario_events
    ORDER BY timing ASC
  `);

  return rows.map((row: any) => ({
    id: row.id,
    timing: row.timing,
    eventName: row.event_name,
    details: row.details,
    characters: JSON.parse(row.characters || '[]'),
    visuals: row.visuals,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getEvent(id: string): Promise<ScenarioEvent | null> {
  const row = await db.get(
    `SELECT id, timing, event_name, details, characters, visuals, notes, status, created_at, updated_at
     FROM scenario_events WHERE id = ?`,
    [id]
  );

  if (!row) return null;

  return {
    id: row.id,
    timing: row.timing,
    eventName: row.event_name,
    details: row.details,
    characters: JSON.parse(row.characters || '[]'),
    visuals: row.visuals,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveEvent(event: ScenarioEvent): Promise<string> {
  const now = new Date().toISOString();
  const createdAt = event.createdAt || now;

  await db.run(
    `INSERT OR REPLACE INTO scenario_events 
     (id, timing, event_name, details, characters, visuals, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.timing,
      event.eventName,
      event.details,
      JSON.stringify(event.characters),
      event.visuals,
      event.notes,
      event.status,
      createdAt,
      now,
    ]
  );

  return event.id;
}

export async function deleteEvent(id: string): Promise<void> {
  await db.run(`DELETE FROM scenario_events WHERE id = ?`, [id]);
}
