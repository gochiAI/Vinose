import { db } from './connection';

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
  console.log('[getDashboardStats] Starting...');
  
  // Count total words from all files
  const wordCountRow = await db.get(
    `SELECT COALESCE(SUM(CAST(json_extract(content, '$.totalWords') AS INTEGER)), 0) as totalWords
     FROM files WHERE type = 'sheet'`
  );
  console.log('[getDashboardStats] wordCountRow:', wordCountRow);

  // Words added in the last 7 days (sum of sheet totals touched in that window)
  const weeklyWordsRow = await db.get(
    `SELECT COALESCE(SUM(CAST(json_extract(content, '$.totalWords') AS INTEGER)), 0) as weeklyWordsAdded
     FROM files
     WHERE type = 'sheet'
       AND datetime(updated_at) >= datetime('now', '-7 days')`
  );
  console.log('[getDashboardStats] weeklyWordsRow:', weeklyWordsRow);

  // Count assets
  const assetCountRow = await db.get(`SELECT COUNT(*) as count FROM assets`);
  console.log('[getDashboardStats] assetCountRow:', assetCountRow);

  // Get chapter count (as compile count)
  const chapterCountRow = await db.get(`SELECT COUNT(*) as count FROM chapters`);
  console.log('[getDashboardStats] chapterCountRow:', chapterCountRow);

  // Calculate completion percentage (based on chapters with completed status)
  const completionRow = await db.get(
    `SELECT CAST(
       COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / 
       NULLIF(COUNT(*), 0)
     AS INTEGER) as percentage
     FROM chapters`
  );
  console.log('[getDashboardStats] completionRow:', completionRow);

  // Get recent chapters (up to 5)
  const recentChapters = await db.all(
    `SELECT id, title, title as sceneId, status, updated_at as edited
     FROM chapters
     ORDER BY updated_at DESC
     LIMIT 5`
  );

  // Get recent assets (up to 4)
  const recentAssets = await db.all(
    `SELECT id, name, type, url FROM assets ORDER BY updated_at DESC LIMIT 4`
  );

  return {
    totalWords: wordCountRow?.totalWords || 0,
    weeklyWordsAdded: weeklyWordsRow?.weeklyWordsAdded || 0,
    assetCount: assetCountRow?.count || 0,
    compileCount: `v${chapterCountRow?.count || 0}`,
    completionPercentage: completionRow?.percentage || 0,
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
