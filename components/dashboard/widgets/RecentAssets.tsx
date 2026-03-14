import React, { useEffect, useState } from 'react';
import { PlusCircle, Upload, User } from 'lucide-react';
import { Asset } from '../../../types';
import { useDatabase } from '../../../contexts/DatabaseContext';

export const RecentAssets = () => {
  const db = useDatabase();
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const dashboardStats = await db.getDashboardStats();
        setAssets(dashboardStats.recentAssets || []);
      } catch (error) {
        console.error('Failed to fetch recent assets:', error);
      }
    };

    fetchAssets();
  }, [db]);
  return (
    <div className="col-span-1 md:col-span-1 lg:col-span-1 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 p-6 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Assets</h3>
          <span className="bg-gray-100 dark:bg-white/10 text-xs px-2 py-0.5 rounded-md text-gray-500">New</span>
        </div>
        <button className="text-primary dark:text-[#4fd1d9] hover:opacity-80 transition-opacity">
          <PlusCircle size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {assets.length > 0 ? (
          assets.map((asset) => (
            <div key={asset.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800 cursor-pointer">
              {asset.url ? (
                <img 
                  src={asset.url} 
                  alt={asset.name} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-purple-900 to-indigo-900 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all">
                  <User size={48} className="text-white/50 group-hover:text-white/80" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-[10px] text-white font-medium truncate">{asset.name}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-500">
            <p>No assets yet</p>
          </div>
        )}
      </div>
    </div>
  );
};