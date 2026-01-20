import { db } from './connection';

export interface ExtendedCharacter {
  id: string;
  name: string;
  role: string;
  age: string;
  height: string;
  avatarUrl: string;
  coverUrl: string;
  description: string;
  relationships: { target: string; type: string; desc: string }[];
  notes: string[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export async function getCharacters(): Promise<ExtendedCharacter[]> {
  const rows = await db.all<any>(
    'SELECT * FROM characters ORDER BY created_at DESC'
  );
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    role: row.role || '',
    age: row.age || '',
    height: row.height || '',
    avatarUrl: row.avatar_url || '',
    coverUrl: row.cover_url || '',
    description: row.description || '',
    relationships: row.relationships ? JSON.parse(row.relationships) : [],
    notes: row.notes ? JSON.parse(row.notes) : [],
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getCharacter(id: string): Promise<ExtendedCharacter | null> {
  const row = await db.get<any>(
    'SELECT * FROM characters WHERE id = ?',
    [id]
  );
  
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    role: row.role || '',
    age: row.age || '',
    height: row.height || '',
    avatarUrl: row.avatar_url || '',
    coverUrl: row.cover_url || '',
    description: row.description || '',
    relationships: row.relationships ? JSON.parse(row.relationships) : [],
    notes: row.notes ? JSON.parse(row.notes) : [],
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveCharacter(character: ExtendedCharacter): Promise<void> {
  const existing = await getCharacter(character.id);
  
  if (existing) {
    // Update
    await db.run(
      `UPDATE characters SET 
        name = ?, role = ?, age = ?, height = ?, avatar_url = ?, cover_url = ?,
        description = ?, relationships = ?, notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        character.name,
        character.role,
        character.age,
        character.height,
        character.avatarUrl,
        character.coverUrl,
        character.description,
        JSON.stringify(character.relationships),
        JSON.stringify(character.notes),
        JSON.stringify(character.tags),
        character.id,
      ]
    );
  } else {
    // Insert
    await db.run(
      `INSERT INTO characters 
        (id, name, role, age, height, avatar_url, cover_url, description, relationships, notes, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        character.id,
        character.name,
        character.role,
        character.age,
        character.height,
        character.avatarUrl,
        character.coverUrl,
        character.description,
        JSON.stringify(character.relationships),
        JSON.stringify(character.notes),
        JSON.stringify(character.tags),
      ]
    );
  }
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.run('DELETE FROM characters WHERE id = ?', [id]);
}
