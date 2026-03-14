import React from 'react';
import { Maximize2 } from 'lucide-react';

export const NarrativeFlow = () => {
  return (
    <div className="col-span-1 md:col-span-1 lg:col-span-1 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 p-6 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Narrative Flow</h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Maximize2 size={20} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative py-2">
        {/* Node 1: Common Route */}
        <div className="plot-node w-32 h-10 rounded-lg bg-primary/20 border border-primary text-primary dark:text-[#4fd1d9] flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(13,73,78,0.2)] z-10 cursor-pointer hover:scale-105 transition-transform">
          Common Route
        </div>

        {/* Vertical Connector */}
        <div className="h-6 w-px bg-gray-300 dark:bg-white/20"></div>

        {/* Branching Logic Container */}
        <div className="relative w-full flex justify-center">
          {/* Horizontal Connector Line */}
          <div className="absolute top-0 w-32 h-px bg-gray-300 dark:bg-white/20 left-1/2 -translate-x-1/2"></div>
          
          <div className="flex justify-center gap-8 w-full pt-6">
            {/* Branch Left: Route A */}
            <div className="flex flex-col items-center relative">
               {/* Connector to horizontal line */}
              <div className="absolute -top-6 h-6 w-px bg-gray-300 dark:bg-white/20"></div>
              
              <div className="plot-node w-24 h-16 rounded-lg bg-white dark:bg-[#151717] border border-secondary text-secondary flex flex-col items-center justify-center p-2 text-center shadow-md cursor-pointer hover:bg-secondary/10 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1">Route A</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">The Choice</span>
              </div>
              
              {/* Dotted Continuation */}
              <div className="h-4 w-px bg-gray-300 dark:bg-white/20 border-l border-dashed border-gray-500"></div>
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            </div>

            {/* Branch Right: Route B */}
            <div className="flex flex-col items-center relative">
               {/* Connector to horizontal line */}
              <div className="absolute -top-6 h-6 w-px bg-gray-300 dark:bg-white/20"></div>
              
              <div className="plot-node w-24 h-16 rounded-lg bg-white dark:bg-[#151717] border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-white/30 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-wider mb-1">Route B</span>
                <span className="text-xs font-semibold">Locked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};