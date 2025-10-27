import React from 'react';

interface ViewSwitcherProps {
  currentView: 'timeline' | 'characterGraph';
  onViewChange: (view: 'timeline' | 'characterGraph') => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex bg-secondary p-1 rounded-lg">
      <button
        onClick={() => onViewChange('timeline')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          currentView === 'timeline' ? 'bg-tertiary text-white' : 'text-text-secondary hover:bg-border-color'
        }`}
      >
        Timeline
      </button>
      <button
        onClick={() => onViewChange('characterGraph')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          currentView === 'characterGraph' ? 'bg-tertiary text-white' : 'text-text-secondary hover:bg-border-color'
        }`}
      >
        Character Graph
      </button>
    </div>
  );
};
