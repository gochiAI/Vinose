import { db } from "./connection";
import type { SceneNode } from "../types";

export async function getSceneNodes(
  chapterId?: string,
  episodeId?: string,
): Promise<SceneNode[]> {
  // 1. Remove the hardcoded WHERE and ORDER BY clauses here
  let query = `SELECT id, chapter_id, episode_id, title, type, summary, script, flags, next_ids, created_at, updated_at
   FROM scene_nodes`;
  
  const params: string[] = [];
  const conditions: string[] = [];

  // 2. Build conditions dynamically (This logic was already correct)
  if (chapterId) {
    conditions.push("chapter_id = ?");
    params.push(chapterId);
  }

  if (episodeId) {
    conditions.push("episode_id = ?");
    params.push(episodeId);
  }

  // 3. Append WHERE only if needed
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // 4. Append ORDER BY at the very end
  query += " ORDER BY order_index ASC, created_at ASC";

  const rows = await db.all(query, params);

  return rows.map((row: any) => ({
    id: row.id,
    chapterId: row.chapter_id,
    episodeId: row.episode_id,
    title: row.title,
    type: row.type,
    summary: row.summary,
    script: row.script,
    flags: JSON.parse(row.flags || "{}"),
    nextIds: JSON.parse(row.next_ids || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getUnassignedNodes(
  chapterId: string,
): Promise<SceneNode[]> {
  const rows = await db.all(
    `SELECT id, chapter_id, episode_id, title, type, summary, script, flags, next_ids, order_index, created_at, updated_at
     FROM scene_nodes
     WHERE chapter_id = ? AND episode_id IS NULL
     ORDER BY order_index ASC, created_at ASC`,
    [chapterId],
  );

  return rows.map((row: any) => ({
    id: row.id,
    chapterId: row.chapter_id,
    episodeId: row.episode_id,
    title: row.title,
    type: row.type,
    summary: row.summary,
    script: row.script,
    flags: JSON.parse(row.flags || "{}"),
    nextIds: JSON.parse(row.next_ids || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function saveSceneNode(node: SceneNode): Promise<string> {
  const now = new Date().toISOString();
  const createdAt = node.createdAt || now;

  await db.run(
    `INSERT OR REPLACE INTO scene_nodes 
     (id, chapter_id, episode_id, title, type, summary, script, flags, next_ids, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      node.id,
      node.chapterId,
      node.episodeId || null,
      node.title,
      node.type,
      node.summary,
      node.script,
      JSON.stringify(node.flags),
      JSON.stringify(node.nextIds),
      createdAt,
      now,
    ],
  );

  return node.id;
}

export async function deleteSceneNode(id: string): Promise<void> {
  await db.run(`DELETE FROM scene_nodes WHERE id = ?`, [id]);
}
