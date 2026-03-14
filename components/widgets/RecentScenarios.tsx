import React from 'react';
import { MoreVertical, FileText } from 'lucide-react';
import { Episode } from '../../types';
import { StatusBadge } from '../common/StatusBadge';


export const RecentEpisodes = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <div className="col-span-1 md:col-span-1 lg:col-span-2 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 p-0 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 pb-2 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent episodes</h3>
        <a href="#" className="text-xs font-bold text-primary dark:text-[#4fd1d9] hover:underline">View All</a>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500 dark:text-gray-500 uppercase bg-gray-50 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 font-semibold rounded-l-lg">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Edited</th>
              <th className="px-4 py-3 font-semibold rounded-r-lg text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {episodes.map((episode) => (
              <tr 
                key={episode.id} 
                className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={onNavigate}
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${episode.status === 'Draft' ? 'bg-primary/10 text-primary dark:text-[#4fd1d9]' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="font-bold">{episode.title}</div>
                      <div className="text-xs text-gray-500">{episode.sceneId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={episode.status} showDot className="rounded-full" />
                </td>
                <td className="px-4 py-3 text-gray-500">{episode.edited}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-gray-400 hover:text-white">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};