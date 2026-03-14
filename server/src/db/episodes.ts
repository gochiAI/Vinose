import { db } from './connection';
import type { Episode,SceneNode } from '../types';

export async function getEpisodes(chapterId?: string): Promise<Episode[]> {
  try {
    const query = chapterId
      ? `SELECT * FROM episodes WHERE chapter_id = ? ORDER BY order_index ASC`
      : `SELECT * FROM episodes ORDER BY chapter_id ASC, order_index ASC`;
    
    const params = chapterId ? [chapterId] : [];
    const rows = await db.all(query, params);

    return rows.map((row: any) => ({
      id: row.id,
      chapterId: row.chapter_id,
      title: row.title,
      episodeNumber: row.order_index ?? 0,
      orderIndex: row.order_index,
      description: row.details,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('[DB Episodes] getEpisodes error:', error);
    return [];
  }
}

export async function createEpisode(episode: Episode): Promise<string> {
  try {
    const now = new Date().toISOString();
    const createdAt = episode.createdAt || now;

        await db.run(
          `INSERT INTO episodes 
           (id, chapter_id, timing, title, details, status, order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            episode.id,
            episode.chapterId,
            null,
            episode.title || 'Untitled',
            episode.description || '',
            episode.status || 'draft',
            episode.orderIndex ?? episode.episodeNumber ?? 0,
            createdAt,
            now,
          ]
        );

    return episode.id;
  } catch (error) {
    console.error('[DB Episodes] createEpisode error:', error);
    throw error;
  }
}

export async function saveEpisode(episode: Episode): Promise<string> {
  try {
    const now = new Date().toISOString();
    const createdAt = episode.createdAt || now;

    await db.run(
        `INSERT OR REPLACE INTO episodes 
         (id, chapter_id, timing, title, details, status, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          episode.id,
          episode.chapterId,
          null,
          episode.title || 'Untitled',
          episode.description || '',
          episode.status || 'draft',
          episode.orderIndex ?? episode.episodeNumber ?? 0,
          createdAt,
          now,
        ]
    );

    return episode.id;
  } catch (error) {
    console.error('[DB Episodes] saveEpisode error:', error);
    throw error;
  }
}

export async function deleteEpisode(id: string): Promise<void> {
  try {
    await db.run(`DELETE FROM episodes WHERE id = ?`, [id]);
  } catch (error) {
    console.error('[DB Episodes] deleteEpisode error:', error);
    throw error;
  }
}
