import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { translations, TranslationKey } from '../i18n';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface UserGuideProps {
    onClose: () => void;
    onStepChange?: (stepKey: string) => void;
}

type GuideStep = {
    key: string; 
    selector?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
};

const guideSteps: GuideStep[] = [
    { key: 'welcome' },
    { key: 'projectName', selector: '[data-tour-id="project-name"]' },
    { key: 'sidebar', selector: '[data-tour-id="sidebar"]' },
    { key: 'timeline', selector: '[data-tour-id="timeline-view"]' },
    { key: 'addScene', selector: '[data-tour-id="add-scene-button"]' },
    { key: 'sceneEditor', selector: '[data-tour-id="scene-editor-main-panel"]', position: 'right' },
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
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const { t, language } = useSettings();

    const currentStep = guideSteps[stepIndex];

    useLayoutEffect(() => {
        setIsDetailOpen(false); // Reset detail view on step change
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
        const { innerWidth, innerHeight } = window;

        if (!highlightRect) { // Center for steps without highlight
            top = innerHeight / 2 - popoverRect.height / 2;
            left = innerWidth / 2 - popoverRect.width / 2;
        } else {
            const isWide = highlightRect.width > popoverRect.width * 1.5;

            const positions = {
                bottom: {
                    top: highlightRect.bottom + gap,
                    left: isWide ? highlightRect.left : highlightRect.left + highlightRect.width / 2 - popoverRect.width / 2,
                },
                top: {
                    top: highlightRect.top - popoverRect.height - gap,
                    left: isWide ? highlightRect.left : highlightRect.left + highlightRect.width / 2 - popoverRect.width / 2,
                },
                right: {
                    top: highlightRect.top,
                    left: highlightRect.right + gap,
                },
                left: {
                    top: highlightRect.top + highlightRect.height / 2 - popoverRect.height / 2,
                    left: highlightRect.left - popoverRect.width - gap,
                }
            };

            const checkFit = (pos: {top: number, left: number}) => {
                return (
                    pos.top >= gap &&
                    pos.left >= gap &&
                    pos.top + popoverRect.height <= innerHeight - gap &&
                    pos.left + popoverRect.width <= innerWidth - gap
                );
            };
            
            const preferredPosition = currentStep.position;
            const priority = preferredPosition 
                ? [preferredPosition, ...['bottom', 'top', 'right', 'left'].filter(p => p !== preferredPosition)]
                : ['bottom', 'top', 'right', 'left'];

            let bestPosition = null;

            for (const p of priority) {
                if (checkFit(positions[p as keyof typeof positions])) {
                    bestPosition = positions[p as keyof typeof positions];
                    break;
                }
            }

            if (!bestPosition) {
                bestPosition = positions[priority[0] as keyof typeof positions];
            }
            
            top = bestPosition.top;
            left = bestPosition.left;

            if (left < gap) left = gap;
            if (top < gap) top = gap;
            if (left + popoverRect.width > innerWidth - gap) {
                left = innerWidth - popoverRect.width - gap;
            }
            if (top + popoverRect.height > innerHeight - gap) {
                top = innerHeight - popoverRect.height - gap;
            }
        }
        
        setPopoverStyle({ top: `${top}px`, left: `${left}px`, opacity: 1 });

    }, [highlightRect, stepIndex, isDetailOpen, currentStep]);
    
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
    const detailContentKey = `guide.${currentStep.key}Content.detail` as TranslationKey;
    const hasDetail = detailContentKey in translations[language];
    const detailContent = hasDetail ? t(detailContentKey, language) : null;
    
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
                <p className="text-base text-muted-foreground mb-4 whitespace-pre-line">{t(contentKey, language)}</p>
                
                {hasDetail && (
                    <div className="mb-4">
                        <button
                            onClick={() => setIsDetailOpen(!isDetailOpen)}
                            className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
                        >
                            {isDetailOpen ? t('guide.hideDetail', language) : t('guide.showDetail', language)}
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDetailOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDetailOpen && (
                            <div className="mt-2 p-3 bg-secondary rounded-md text-sm text-secondary-foreground whitespace-pre-line animate-fade-in-fast border border-border">
                                {detailContent}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center mt-4">
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