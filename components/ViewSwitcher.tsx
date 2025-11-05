import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

type MainView = 'timeline' | 'characterGraph' | 'aiAssistant';

interface ViewSwitcherProps {
  currentView: MainView;
  onViewChange: (view: MainView) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const { t, language } = useSettings();

  return (
    <div className="flex bg-secondary p-1 rounded-lg">
      <button
        onClick={() => onViewChange('timeline')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          currentView === 'timeline' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-border'
        }`}
      >
        {t('timeline', language)}
      </button>
      <button
        onClick={() => onViewChange('characterGraph')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          currentView === 'characterGraph' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-border'
        }`}
      >
        {t('characterGraph', language)}
      </button>
      <button
        onClick={() => onViewChange('aiAssistant')}
        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          currentView === 'aiAssistant' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-border'
        }`}
      >
        {t('aiAssistant', language)}
      </button>
    </div>
  );
};
