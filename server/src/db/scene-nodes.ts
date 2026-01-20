import { db } from './connection';

export interface SceneNode {
  id: string;
  chapterId: string;
  title: string;
  type: 'dialogue' | 'narration' | 'choice' | 'branch';
  script: string;
  background: string;
  bgm: string;
  sfx: string;
  flags: Record<string, any>;
  nextIds: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getNodesForChapter(chapterId: string): Promise<SceneNode[]> {
  console.log('[DB] getNodesForChapter - chapterId:', chapterId);
  const rows = await db.all(
    `SELECT id, chapter_id, title, type, script, background, bgm, sfx, flags, next_ids, created_at, updated_at
     FROM scene_nodes WHERE chapter_id = ? ORDER BY created_at ASC`,
    [chapterId]
  );
  console.log('[DB] getNodesForChapter - found', rows.length, 'rows');

  return rows.map((row: any) => ({
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    type: row.type,
    script: row.script,
    background: row.background,
    bgm: row.bgm,
    sfx: row.sfx,
    flags: JSON.parse(row.flags || '{}'),
    nextIds: JSON.parse(row.next_ids || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getSceneNode(id: string): Promise<SceneNode | null> {
  const row = await db.get(
    `SELECT id, chapter_id, title, type, script, background, bgm, sfx, flags, next_ids, created_at, updated_at
     FROM scene_nodes WHERE id = ?`,
    [id]
  );

  if (!row) return null;

  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    type: row.type,
    script: row.script,
    background: row.background,
    bgm: row.bgm,
    sfx: row.sfx,
    flags: JSON.parse(row.flags || '{}'),
    nextIds: JSON.parse(row.next_ids || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveSceneNode(node: SceneNode): Promise<string> {
  const now = new Date().toISOString();
  const createdAt = node.createdAt || now;

  await db.run(
    `INSERT OR REPLACE INTO scene_nodes 
     (id, chapter_id, title, type, script, background, bgm, sfx, flags, next_ids, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      node.id,
      node.chapterId,
      node.title,
      node.type,
      node.script,
      node.background,
      node.bgm,
      node.sfx,
      JSON.stringify(node.flags),
      JSON.stringify(node.nextIds),
      createdAt,
      now,
    ]
  );

  return node.id;
}

export async function deleteSceneNode(id: string): Promise<void> {
  await db.run(`DELETE FROM scene_nodes WHERE id = ?`, [id]);
}
