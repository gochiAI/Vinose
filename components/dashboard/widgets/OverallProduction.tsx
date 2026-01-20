import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useDatabase } from '../../../contexts/DatabaseContext';

interface Stats {
  totalWords: number;
  weeklyWordsAdded: number;
  assetCount: number;
  compileCount: string;
  completionPercentage: number;
}

export const OverallProduction = () => {
  const db = useDatabase();
  const [stats, setStats] = useState<Stats>({
    totalWords: 0,
    weeklyWordsAdded: 0,
    assetCount: 0,
    compileCount: 'v0',
    completionPercentage: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('[OverallProduction] Fetching dashboard stats...');
        const dashboardStats = await db.getDashboardStats();
        console.log('[OverallProduction] Stats received:', dashboardStats);
        setStats({
          totalWords: dashboardStats.totalWords || 0,
          weeklyWordsAdded: dashboardStats.weeklyWordsAdded || 0,
          assetCount: dashboardStats.assetCount || 0,
          compileCount: dashboardStats.compileCount || 'v0',
          completionPercentage: dashboardStats.completionPercentage || 0,
        });
      } catch (error) {
        console.error('[OverallProduction] Failed to fetch dashboard stats:', error);
      }
    };

    fetchStats();
  }, [db]);
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 p-6 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <BarChart3 size={128} className="text-primary" />
      </div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Overall Production</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Project milestone: Alpha Release</p>
        </div>
        <span className="bg-primary/10 text-primary dark:text-[#4fd1d9] px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
          On Track
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Words</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalWords / 1000).toFixed(1)}k</p>
          <p className="text-green-500 text-xs font-medium flex items-center mt-1">
            <TrendingUp size={14} className="mr-0.5" /> +{(stats.weeklyWordsAdded / 1000).toFixed(1)}k this week
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Asset Files</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assetCount}</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs font-medium mt-1">Images & Audio</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Compiles</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.compileCount}</p>
          <p className="text-xs font-medium text-secondary mt-1">Current</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">Scenario Completion</span>
          <span className="font-bold text-gray-900 dark:text-white">{stats.completionPercentage}%</span>
        </div>
        <div className="h-3 w-full bg-gray-100 dark:bg-black/40 rounded-full overflow-hidden flex">
          <div className="h-full bg-primary" style={{ width: `${Math.min(100, stats.completionPercentage)}%` }}></div>
          <div className="h-full bg-secondary" style={{ width: `${Math.max(0, 100 - Math.min(100, stats.completionPercentage))}%` }}></div>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-xs text-gray-500">Polished</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-xs text-gray-500">Drafting</span>
          </div>
        </div>
      </div>
    </div>
  );
};