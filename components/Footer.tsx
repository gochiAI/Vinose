
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { TimelineIcon } from './icons/TimelineIcon';
import { CharacterIcon } from './icons/CharacterIcon';
import { SparklesIcon } from './icons/SparklesIcon';

type MainView = 'timeline' | 'characterGraph' | 'aiAssistant';

interface FooterProps {
  currentView: MainView;
  onViewChange: (view: MainView) => void;
}

const FooterButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, isActive, label, children }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs transition-colors ${
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
    <span>{label}</span>
  </button>
);

export const Footer: React.FC<FooterProps> = ({ currentView, onViewChange }) => {
  const { t, language } = useSettings();

  return (
    <footer className="md:hidden flex bg-card border-t border-border shadow-t-lg z-30">
      <FooterButton
        onClick={() => onViewChange('timeline')}
        isActive={currentView === 'timeline'}
        label={t('timeline', language)}
      >
        <TimelineIcon className="w-6 h-6 mb-0.5" />
      </FooterButton>
      <FooterButton
        onClick={() => onViewChange('characterGraph')}
        isActive={currentView === 'characterGraph'}
        label={t('characterGraph', language)}
      >
        <CharacterIcon className="w-6 h-6 mb-0.5" />
      </FooterButton>
      <FooterButton
        onClick={() => onViewChange('aiAssistant')}
        isActive={currentView === 'aiAssistant'}
        label={t('aiAssistant', language)}
      >
        <SparklesIcon className="w-6 h-6 mb-0.5" />
      </FooterButton>
    </footer>
  );
};
