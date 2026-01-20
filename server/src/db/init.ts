import { db } from './connection';

export async function initializeDatabase() {
  try {
    await db.exec(`
      -- Characters table
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        age TEXT,
        height TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        description TEXT,
        tags TEXT,
        notes TEXT,
        relationships TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Assets table
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        subtype TEXT,
        url TEXT,
        size TEXT,
        date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Scene nodes table
      CREATE TABLE IF NOT EXISTS scene_nodes (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        summary TEXT,
        script TEXT,
        background TEXT,
        backgrounds TEXT,
        bgm TEXT,
        sfx TEXT,
        flags TEXT,
        next_ids TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Chapters table
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        scene_count INTEGER DEFAULT 0,
        last_edited DATETIME,
        status TEXT DEFAULT 'Draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Scenario events table
      CREATE TABLE IF NOT EXISTS scenario_events (
        id TEXT PRIMARY KEY,
        timing TEXT,
        event_name TEXT NOT NULL,
        details TEXT,
        characters TEXT,
        visuals TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Files/Documents table
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT,
        content TEXT,
        owner TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES files(id) ON DELETE CASCADE
      );

      -- Project metadata table
      CREATE TABLE IF NOT EXISTS project_meta (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Project info table
      CREATE TABLE IF NOT EXISTS project_info (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
      CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
      CREATE INDEX IF NOT EXISTS idx_scene_nodes_chapter ON scene_nodes(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_files_parent ON files(parent_id);
      CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
    `);

    console.log('[Database] Schema initialized successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}

// Run initialization on module load if needed
export async function ensureDatabase() {
  try {
    // Check if tables exist
    const result = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='characters'"
    );
    
    if (!result || result.count === 0) {
      console.log('[Database] Tables not found, initializing...');
      await initializeDatabase();
      await seedInitialData();
    }
  } catch (error) {
    console.error('[Database] Ensure error:', error);
    throw error;
  }
}

async function seedInitialData(): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Check and seed project info
    const projectCount = await db.get(
      `SELECT COUNT(*) as count FROM project_info`
    );

    if (projectCount && projectCount.count === 0) {
      console.log('[Database] Seeding initial project info...');
      await db.run(
        `INSERT INTO project_info (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        ['1', 'Eternal Echoes', 'A narrative visual novel project', now, now]
      );
      console.log('[Database] Initial project info seeded');
    }

    // Check if scratchpad data already exists
    const existingCount = await db.get(
      `SELECT COUNT(*) as count FROM project_meta WHERE key LIKE 'scratchpad_%'`
    );

    if (existingCount && existingCount.count === 0) {
      console.log('[Database] Seeding initial scratchpad data...');

      const scratchpadItems = [
        { id: '1', text: 'Fix typo in Scene 2 dialogue', completed: true },
        { id: '2', text: 'Request sprite variation for Akira (Angry)', completed: false },
        { id: '3', text: 'Review sound effects for rain scene', completed: false },
      ];

      for (const item of scratchpadItems) {
        await db.run(
          `INSERT INTO project_meta (key, value, updated_at) VALUES (?, ?, ?)`,
          [
            `scratchpad_${item.id}`,
            JSON.stringify(item),
            now,
          ]
        );
      }
      console.log('[Database] Initial scratchpad data seeded');
    }
  } catch (error) {
    console.warn('[Database] Seed initial data warning:', error);
    // Don't throw - seeding is optional
  }
}
