import { db } from './connection';

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProjectInfo(): Promise<ProjectInfo | null> {
  console.log('[DB] getProjectInfo');
  const row = await db.get(
    `SELECT id, name, description, created_at, updated_at
     FROM project_info LIMIT 1`
  );

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateProjectInfo(name: string, description?: string): Promise<ProjectInfo> {
  console.log('[DB] updateProjectInfo - name:', name);
  const now = new Date().toISOString();
  
  // Get existing project info or create new one
  const existing = await getProjectInfo();
  
  if (existing) {
    await db.run(
      `UPDATE project_info SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
      [name, description || '', now, existing.id]
    );
    return {
      id: existing.id,
      name,
      description,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  } else {
    const id = Date.now().toString();
    await db.run(
      `INSERT INTO project_info (id, name, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, description || '', now, now]
    );
    return {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
    };
  }
}
