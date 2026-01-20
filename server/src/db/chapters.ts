import { db } from './connection';

export interface Chapter {
  id: string;
  title: string;
  sceneCount: number;
  status: 'draft' | 'editing' | 'completed';
  lastEdited: string;
  createdAt: string;
  updatedAt: string;
}

export async function getChapters(): Promise<Chapter[]> {
  const rows = await db.all(`
    SELECT id, title, scene_count, status, last_edited, created_at, updated_at
    FROM chapters
    ORDER BY created_at ASC
  `);

  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    sceneCount: row.scene_count,
    status: row.status,
    lastEdited: row.last_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const row = await db.get(
    `SELECT id, title, scene_count, status, last_edited, created_at, updated_at
     FROM chapters WHERE id = ?`,
    [id]
  );

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    sceneCount: row.scene_count,
    status: row.status,
    lastEdited: row.last_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveChapter(chapter: Chapter): Promise<string> {
  const now = new Date().toISOString();
  const createdAt = chapter.createdAt || now;

  await db.run(
    `INSERT OR REPLACE INTO chapters (id, title, scene_count, status, last_edited, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      chapter.id,
      chapter.title,
      chapter.sceneCount,
      chapter.status,
      chapter.lastEdited || now,
      createdAt,
      now,
    ]
  );

  return chapter.id;
}

export async function deleteChapter(id: string): Promise<void> {
  await db.run(`DELETE FROM chapters WHERE id = ?`, [id]);
}
