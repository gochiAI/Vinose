import { db } from './connection.js';

export interface FileItem {
  id: string;
  parentId: string | null;
  name: string;
  type: 'folder' | 'doc' | 'sheet';
  updatedAt: string;
  url?: string;
  content?: any;
  owner?: string;
  createdAt?: string;
}

export async function getFiles(): Promise<FileItem[]> {
  const rows = await db.all<any>(
    'SELECT * FROM files ORDER BY created_at DESC'
  );
  
  return rows.map(row => ({
    id: row.id,
    parentId: row.parent_id || null,
    name: row.name,
    type: row.type,
    updatedAt: row.updated_at,
    url: row.url,
    content: row.content ? JSON.parse(row.content) : undefined,
    owner: row.owner,
    createdAt: row.created_at,
  }));
}

export async function getFilesInFolder(parentId: string | null): Promise<FileItem[]> {
  const parentClause = parentId === null ? 'parent_id IS NULL' : 'parent_id = ?';
  const params = parentId === null ? [] : [parentId];
  
  const rows = await db.all<any>(
    `SELECT * FROM files WHERE ${parentClause} ORDER BY created_at DESC`,
    params
  );
  
  return rows.map(row => ({
    id: row.id,
    parentId: row.parent_id || null,
    name: row.name,
    type: row.type,
    updatedAt: row.updated_at,
    url: row.url,
    content: row.content ? JSON.parse(row.content) : undefined,
    owner: row.owner,
    createdAt: row.created_at,
  }));
}

export async function getFile(id: string): Promise<FileItem | null> {
  const row = await db.get<any>(
    'SELECT * FROM files WHERE id = ?',
    [id]
  );
  
  if (!row) return null;
  
  return {
    id: row.id,
    parentId: row.parent_id || null,
    name: row.name,
    type: row.type,
    updatedAt: row.updated_at,
    url: row.url,
    content: row.content ? JSON.parse(row.content) : undefined,
    owner: row.owner,
    createdAt: row.created_at,
  };
}

export async function saveFile(file: FileItem): Promise<void> {
  const existing = await getFile(file.id);
  
  if (existing) {
    // Update
    await db.run(
      `UPDATE files SET 
        parent_id = ?, name = ?, type = ?, url = ?, content = ?, owner = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        file.parentId,
        file.name,
        file.type,
        file.url || null,
        file.content ? JSON.stringify(file.content) : null,
        file.owner || null,
        file.id,
      ]
    );
  } else {
    // Insert
    await db.run(
      `INSERT INTO files (id, parent_id, name, type, url, content, owner)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        file.id,
        file.parentId,
        file.name,
        file.type,
        file.url || null,
        file.content ? JSON.stringify(file.content) : null,
        file.owner || null,
      ]
    );
  }
}

export async function deleteFile(id: string): Promise<void> {
  await db.run('DELETE FROM files WHERE id = ?', [id]);
}
