import React from 'react';
import { OverallProduction } from './widgets/OverallProduction';
import { RecentEpisodes } from './widgets/RecentEpisodes';
import { RecentAssets } from './widgets/RecentAssets';
import { Scratchpad } from './widgets/Scratchpad';

interface DashboardProps {
  onNavigate: () => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <OverallProduction />
        <RecentEpisodes onNavigate={onNavigate} />
        <RecentAssets />
        <Scratchpad />
      </div>
    </div>
  );
};