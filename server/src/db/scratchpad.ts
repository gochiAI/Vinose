import { db } from './connection.js';

export interface ScratchpadItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getScratchpadItems(): Promise<ScratchpadItem[]> {
  // project_meta only has key/value/updated_at; use updated_at for ordering
  const rows = await db.all<any>(`
    SELECT key, value, updated_at
    FROM project_meta
    WHERE key LIKE 'scratchpad_%'
    ORDER BY updated_at DESC
  `);

  return rows.map((row: any) => {
    const data = JSON.parse(row.value);
    return {
      id: data.id,
      text: data.text,
      completed: data.completed,
      createdAt: row.updated_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function getScratchpadItem(id: string): Promise<ScratchpadItem | null> {
  const row = await db.get<any>(
    `SELECT value, updated_at FROM project_meta WHERE key = ?`,
    [`scratchpad_${id}`]
  );

  if (!row) return null;

  const data = JSON.parse(row.value);
  return {
    id: data.id,
    text: data.text,
    completed: data.completed,
    createdAt: row.updated_at,
    updatedAt: row.updated_at,
  };
}

export async function saveScratchpadItem(item: ScratchpadItem): Promise<string> {
  const now = new Date().toISOString();

  await db.run(
    `INSERT OR REPLACE INTO project_meta (key, value, updated_at)
     VALUES (?, ?, ?)`,
    [
      `scratchpad_${item.id}`,
      JSON.stringify({
        id: item.id,
        text: item.text,
        completed: item.completed,
      }),
      now,
    ]
  );

  return item.id;
}

export async function deleteScratchpadItem(id: string): Promise<void> {
  await db.run(`DELETE FROM project_meta WHERE key = ?`, [`scratchpad_${id}`]);
}
