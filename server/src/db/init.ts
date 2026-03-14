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

      -- Episodes table (旧scenario_events)
      CREATE TABLE IF NOT EXISTS episodes (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        timing TEXT,
        title TEXT NOT NULL,
        details TEXT,
        characters TEXT,
        visuals TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Draft',
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      );

      -- Scene nodes table
      CREATE TABLE IF NOT EXISTS scene_nodes (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        episode_id TEXT,
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
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
        FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE SET NULL
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
      CREATE INDEX IF NOT EXISTS idx_episodes_chapter ON episodes(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_scene_nodes_chapter ON scene_nodes(chapter_id);
      CREATE INDEX IF NOT EXISTS idx_scene_nodes_episode ON scene_nodes(episode_id);
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

    // Check if chapters data already exists
    const chapterCount = await db.get(
      `SELECT COUNT(*) as count FROM chapters`
    );

    if (chapterCount && chapterCount.count === 0) {
      console.log('[Database] Seeding initial chapters...');

      const chapters = [
        {
          id: 'ch_awakening',
          title: '第一章 目覚め',
          sceneCount: 5,
          status: 'draft',
        },
        {
          id: 'ch_cafe',
          title: '第二章 カフェ',
          sceneCount: 4,
          status: 'draft',
        },
        {
          id: 'ch_secret',
          title: '第三章 秘密基地',
          sceneCount: 3,
          status: 'draft',
        },
      ];

      for (const chapter of chapters) {
        await db.run(
          `INSERT INTO chapters (id, title, scene_count, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [chapter.id, chapter.title, chapter.sceneCount, chapter.status, now, now]
        );
      }
      console.log('[Database] Initial chapters seeded');
    }

    // Check if scene nodes data already exists
    const sceneNodeCount = await db.get(
      `SELECT COUNT(*) as count FROM scene_nodes`
    );

    if (sceneNodeCount && sceneNodeCount.count === 0) {
      console.log('[Database] Seeding initial scene nodes...');

      const sceneNodes = [
        // Chapter 1: 目覚め
        {
          id: 'c1-1',
          chapterId: 'ch_awakening',
          title: 'Opening Scene',
          type: 'start',
          summary: 'The protagonist wakes up in a mysterious room.',
          script: 'INT. MYSTERIOUS ROOM - MORNING\n\nA young person slowly opens their eyes...',
          orderIndex: 0,
        },
        {
          id: 'c1-2',
          chapterId: 'ch_awakening',
          title: 'First Choice',
          type: 'choice',
          summary: 'Player decides what to do first.',
          script: 'What should I do?\n\nA) Investigate the room\nB) Look for an exit',
          orderIndex: 1,
        },
        // Chapter 2: カフェ
        {
          id: 'c2-1',
          chapterId: 'ch_cafe',
          title: 'Cafe Entrance',
          type: 'scene',
          summary: 'Arriving at the mysterious cafe.',
          script: 'EXT. CAFE - DAY\n\nThe cafe appears before you...',
          orderIndex: 0,
        },
        {
          id: 'c2-2',
          chapterId: 'ch_cafe',
          title: 'Meeting the Barista',
          type: 'dialogue',
          summary: 'First conversation with the mysterious barista.',
          script: 'BARISTA: "Welcome. What can I get you today?"',
          orderIndex: 1,
        },
        // Chapter 3: 秘密基地
        {
          id: 'c3-1',
          chapterId: 'ch_secret',
          title: 'The Secret Base',
          type: 'scene',
          summary: 'Finding the hidden entrance.',
          script: 'EXT. FOREST - NIGHT\n\nIt was hidden behind the waterfall.',
          orderIndex: 0,
        },
      ];

      for (const node of sceneNodes) {
        await db.run(
          `INSERT INTO scene_nodes (id, chapter_id, title, type, summary, script, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [node.id, node.chapterId, node.title, node.type, node.summary, node.script, node.orderIndex, now, now]
        );
      }
      console.log('[Database] Initial scene nodes seeded');
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
