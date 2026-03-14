import { db } from './connection.js';

export interface DashboardStats {
  totalWords: number;
  weeklyWordsAdded: number;
  assetCount: number;
  compileCount: string;
  completionPercentage: number;
  recentChapters: Array<{
    id: string;
    title: string;
    sceneId: string;
    status: string;
    edited: string;
  }>;
  recentAssets: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  
  
  // Count total words from all scene nodes' scripts
  const wordCountRow = await db.get<any>(
    `SELECT COALESCE(SUM(
       LENGTH(script) - LENGTH(REPLACE(script, ' ', '')) + 1
     ), 0) as totalWords
     FROM scene_nodes
     WHERE script IS NOT NULL AND script != ''`
  );
  

  // Words added in the last 7 days
  const weeklyWordsRow = await db.get<any>(
    `SELECT COALESCE(SUM(
       LENGTH(script) - LENGTH(REPLACE(script, ' ', '')) + 1
     ), 0) as weeklyWordsAdded
     FROM scene_nodes
     WHERE script IS NOT NULL AND script != ''
       AND datetime(updated_at) >= datetime('now', '-7 days')`
  );
  

  // Count assets
  const assetCountRow = await db.get<any>(`SELECT COUNT(*) as count FROM assets`);
  

  // Get scene count (as compile count)
  const sceneCountRow = await db.get<any>(`SELECT COUNT(*) as count FROM scene_nodes`);
  

  // Calculate completion percentage (based on chapters with episodes)
  const completionRow = await db.get<any>(
    `SELECT CAST(
       COUNT(CASE WHEN EXISTS (
         SELECT 1 FROM episodes WHERE chapter_id = chapters.id
       ) THEN 1 END) * 100.0 / 
       NULLIF(COUNT(*), 0)
     AS INTEGER) as percentage
     FROM chapters`
  );
  

  // Get recent episodes with scene counts (up to 5)
  const recentChapters = await db.all<any>(
    `SELECT 
       e.id, 
       e.title, 
       COUNT(sn.id) || ' scenes' as sceneId,
       e.status,
       e.updated_at as edited
     FROM episodes e
     LEFT JOIN scene_nodes sn ON sn.episode_id = e.id
     GROUP BY e.id, e.title, e.status, e.updated_at
     ORDER BY e.updated_at DESC
     LIMIT 5`
  );

  // Get recent assets (up to 4)
  const recentAssets = await db.all<any>(
    `SELECT id, name, type, url FROM assets ORDER BY updated_at DESC LIMIT 4`
  );

  return {
    totalWords: (wordCountRow as any)?.totalWords || 0,
    weeklyWordsAdded: (weeklyWordsRow as any)?.weeklyWordsAdded || 0,
    assetCount: (assetCountRow as any)?.count || 0,
    compileCount: `v${(sceneCountRow as any)?.count || 0}`,
    completionPercentage: (completionRow as any)?.percentage || 0,
    recentChapters: recentChapters.map((ch: any) => ({
      id: ch.id,
      title: ch.title,
      sceneId: ch.sceneId,
      status: ch.status === 'completed' ? 'Final' : ch.status === 'editing' ? 'Review' : 'Draft',
      edited: formatTimeAgo(ch.edited),
    })),
    recentAssets: recentAssets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      url: asset.url || '',
    })),
  };
}

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
