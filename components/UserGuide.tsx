import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { TranslationKey } from '../i18n';

interface UserGuideProps {
    onClose: () => void;
    onStepChange?: (stepKey: string) => void;
}

type GuideStep = {
    key: string; 
    selector?: string;
};

const guideSteps: GuideStep[] = [
    { key: 'welcome' },
    { key: 'projectName', selector: '[data-tour-id="project-name"]' },
    { key: 'sidebar', selector: '[data-tour-id="sidebar"]' },
    { key: 'timeline', selector: '[data-tour-id="timeline-view"]' },
    { key: 'addScene', selector: '[data-tour-id="add-scene-button"]' },
    { key: 'sceneEditor', selector: '[data-tour-id="editor-sheet"]' },
    { key: 'viewSwitcher', selector: '[data-tour-id="view-switcher"]' },
    { key: 'characterGraph', selector: '[data-tour-id="character-graph-view"]' },
    { key: 'search', selector: '[data-tour-id="search-bar"]' },
    { key: 'io', selector: '[data-tour-id="io-buttons"]' },
    { key: 'settings', selector: '[data-tour-id="settings-button"]' },
    { key: 'end' },
];

export const UserGuide: React.FC<UserGuideProps> = ({ onClose, onStepChange }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const popoverRef = useRef<HTMLDivElement>(null);
    const { t, language } = useSettings();

    const currentStep = guideSteps[stepIndex];

    useLayoutEffect(() => {
        onStepChange?.(currentStep.key);
        const { selector } = currentStep;

        let highlightTimer: number;

        const findAndHighlight = () => {
            if (selector) {
                const element = document.querySelector(selector) as HTMLElement;
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    // Wait for scroll animation and potential re-renders
                    highlightTimer = window.setTimeout(() => {
                        if (document.body.contains(element)) { // check if element is still mounted
                           setHighlightRect(element.getBoundingClientRect());
                        }
                    }, 300);
                } else {
                    console.warn(`Guide element not found: ${selector}`);
                    setHighlightRect(null);
                }
            } else {
                setHighlightRect(null);
            }
        };
        
        // Delay to allow App component to re-render based on onStepChange
        const mainTimer = window.setTimeout(findAndHighlight, 100);

        return () => {
            clearTimeout(mainTimer);
            if (highlightTimer) {
                clearTimeout(highlightTimer);
            }
        };
    }, [stepIndex, currentStep, onStepChange]);

    useLayoutEffect(() => {
        if (!popoverRef.current) return;

        const popover = popoverRef.current;
        let top, left;
        const gap = 16;
        const popoverRect = popover.getBoundingClientRect();

        if (!highlightRect) { // Center for steps without highlight
            top = window.innerHeight / 2 - popoverRect.height / 2;
            left = window.innerWidth / 2 - popoverRect.width / 2;
        } else {
            // Default position: bottom
            top = highlightRect.bottom + gap;
            left = highlightRect.left + highlightRect.width / 2 - popoverRect.width / 2;

            // If not enough space at bottom, try top
            if (top + popoverRect.height > window.innerHeight) {
                top = highlightRect.top - popoverRect.height - gap;
            }
            // If still no space, position beside
            if (top < 0) {
                 top = highlightRect.top;
                 // Try right
                 if(highlightRect.right + popoverRect.width + gap < window.innerWidth) {
                    left = highlightRect.right + gap;
                 } else { // Try left
                    left = highlightRect.left - popoverRect.width - gap;
                 }
            }

            // Adjust horizontal overflow
            if (left < gap) left = gap;
            if (left + popoverRect.width + gap > window.innerWidth) {
                left = window.innerWidth - popoverRect.width - gap;
            }
        }
        setPopoverStyle({ top: `${top}px`, left: `${left}px`, opacity: 1 });

    }, [highlightRect, stepIndex]);
    
    useEffect(() => {
        const handleResize = () => {
            const { selector } = guideSteps[stepIndex];
            if (selector) {
                const element = document.querySelector(selector);
                if (element) {
                    setHighlightRect(element.getBoundingClientRect());
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [stepIndex]);

    const handleNext = () => {
        if (stepIndex < guideSteps.length - 1) setStepIndex(stepIndex + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (stepIndex > 0) setStepIndex(stepIndex - 1);
    };

    const titleKey = `guide.${currentStep.key}Title` as TranslationKey;
    const contentKey = `guide.${currentStep.key}Content` as TranslationKey;
    
    return (
        <div className="fixed inset-0 z-[100]">
            {/* Overlay */}
            <div
                className="fixed inset-0 transition-opacity duration-300"
                style={{
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                    clipPath: highlightRect
                        ? `polygon(
                            0% 0%, 0% 100%, 
                            ${highlightRect.left - 4}px 100%, 
                            ${highlightRect.left - 4}px ${highlightRect.top - 4}px, 
                            ${highlightRect.right + 4}px ${highlightRect.top - 4}px, 
                            ${highlightRect.right + 4}px ${highlightRect.bottom + 4}px, 
                            ${highlightRect.left - 4}px ${highlightRect.bottom + 4}px, 
                            ${highlightRect.left - 4}px 100%, 
                            100% 100%, 100% 0%
                        )`
                        : 'none',
                }}
            />

            {/* Popover */}
            <div
                ref={popoverRef}
                className="fixed bg-card text-card-foreground rounded-lg shadow-2xl p-6 w-full max-w-sm transition-all duration-300"
                style={popoverStyle}
            >
                <h3 className="text-xl font-bold mb-3">{t(titleKey, language)}</h3>
                <p className="text-base text-muted-foreground mb-6 whitespace-pre-line">{t(contentKey, language)}</p>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{stepIndex + 1} / {guideSteps.length}</span>
                    <div className="flex gap-2">
                        {stepIndex > 0 && (
                            <Button variant="secondary" size="sm" onClick={handlePrev}>{t('guide.prev', language)}</Button>
                        )}
                         {stepIndex < guideSteps.length - 1 && (
                            <Button variant="secondary" size="sm" onClick={onClose}>{t('guide.skip', language)}</Button>
                        )}
                        <Button size="sm" onClick={handleNext}>
                            {stepIndex === guideSteps.length - 1 ? t('guide.finish', language) : t('guide.next', language)}
                        </Button>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-secondary rounded-full h-1.5 mt-4">
                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${((stepIndex + 1) / guideSteps.length) * 100}%` }}></div>
                </div>
            </div>
        </div>
    );
};
