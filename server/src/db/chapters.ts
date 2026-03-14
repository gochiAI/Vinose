import { db } from "./connection";
import type { Chapter } from "../types";

export async function getChapters(): Promise<Chapter[]> {
  const rows = await db.all(`
    SELECT 
      c.id, 
      c.title, 
      c.scene_count, 
      c.status, 
      c.created_at, 
      c.updated_at,
      COUNT(DISTINCT e.id) as episode_count
     FROM chapters c
     LEFT JOIN episodes e ON e.chapter_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC
  `);

  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    sceneCount: row.scene_count,
    episodeCount: row.episode_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const row = await db.get<any>(
    `SELECT 
      c.id, 
      c.title, 
      c.scene_count, 
      c.status, 
      c.created_at, 
      c.updated_at,
      COUNT(DISTINCT e.id) as episode_count
     FROM chapters c
     LEFT JOIN episodes e ON e.chapter_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id],
  );

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    sceneCount: row.scene_count,
    episodeCount: row.episode_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveChapter(chapter: Chapter): Promise<string> {
  const now = new Date().toISOString();
  const createdAt = chapter.createdAt || now;

  await db.run(
    `INSERT INTO chapters (id, title, scene_count, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       scene_count = excluded.scene_count,
       status = excluded.status,
       updated_at = excluded.updated_at`,
    [
      chapter.id,
      chapter.title,
      chapter.sceneCount,
      chapter.status,
      createdAt,
      now,
    ],
  );

  return chapter.id;
}

export async function deleteChapter(id: string): Promise<void> {
  await db.run(`DELETE FROM chapters WHERE id = ?`, [id]);
}
