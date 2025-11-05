import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ProjectData, SceneEvent, EventType, AssetType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChatHistory, addChatHistory, getAllChatHistories, updateChatHistory, deleteChatHistory } from '../utils/db';

declare const marked: any;
declare const DOMPurify: any;

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatBotProps {
  projectData: ProjectData;
}

export const ChatBot: React.FC<ChatBotProps> = ({ projectData }) => {
  const { t, language } = useSettings();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chatHistories, setChatHistories] = useState<{ id: number, title: string }[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);

  const isAvailable = !!process.env.API_KEY;

  const getSystemInstruction = useCallback(() => {
    const summarizeEvent = (event: SceneEvent): string => {
        switch(event.type) {
            case EventType.DIALOGUE:
                const char = projectData.characters.find(c => c.id === event.characterId);
                return `Dialogue(${char?.name || 'Unknown'}): "${event.text}"`;
            case EventType.ACTION:
                return `Action: ${event.description}`;
            case EventType.BACKGROUND_CHANGE:
                const bg = projectData.assets.find(a => a.type === AssetType.BACKGROUND && a.id === event.backgroundAssetId);
                return `Background -> ${bg?.name || 'Unknown'}`;
            case EventType.CHOICE:
                const choices = event.choices.map(c => {
                    const scene = projectData.scenes.find(s => s.id === c.nextSceneId);
                    return `"${c.text}" -> ${scene?.title || 'End'}`;
                }).join(', ');
                return `Choice: [${choices}]`;
            case EventType.GOTO_SCENE:
                const scene = projectData.scenes.find(s => s.id === event.nextSceneId);
                return `Go to scene -> ${scene?.title || 'End'}`;
            case EventType.SFX:
                const sfx = projectData.assets.find(a => a.type === AssetType.SFX && a.id === event.sfxAssetId);
                return `SFX: ${sfx?.name || 'Unknown'}`;
            default:
                return `Unknown event`;
        }
    };

    const context = {
        projectName: projectData.projectName,
        characters: projectData.characters.map(c => ({ name: c.name, description: c.description?.substring(0, 100) })),
        locations: projectData.locations.map(l => ({ name: l.name, description: l.description?.substring(0, 100) })),
        items: projectData.items.map(i => ({ name: i.name, description: i.description?.substring(0, 100) })),
        plots: projectData.plots.map(p => p.title),
        scenes: projectData.scenes.map(s => ({ 
            title: s.title, 
            summary: s.events.map(summarizeEvent)
        }))
    };
    
    return `You are a helpful and creative AI assistant for a visual novel writer.
Your role is to help the user with their project by answering questions, providing suggestions for characters, plots, scenes, and dialogue, and helping them organize their ideas.
You have access to the user's current project data for context. Analyze the existing scenes and their order to understand the story's flow before making suggestions.
Always be encouraging and constructive.
Keep your answers concise but informative.
Format your responses using Markdown for readability.

Current Project Context:
${JSON.stringify(context, null, 2)}
`;
  }, [projectData]);
  
  const initializeGeminiInstance = useCallback((history: Message[] = []) => {
    if (!isAvailable) return;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
    
    // The last message should not be a user message when initializing
    if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
        geminiHistory.pop();
    }

    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: geminiHistory,
      config: {
        systemInstruction: getSystemInstruction()
      }
    });
    setChat(newChat);
  }, [isAvailable, getSystemInstruction]);
  
  const startNewChat = useCallback(async () => {
    setMessages([{ role: 'model', content: t('aiAssistantWelcome', language) }]);
    setCurrentChatId(null);
    localStorage.removeItem('vns-lastChatId');
    initializeGeminiInstance();
    setIsHistoryOpen(false);
  }, [t, language, initializeGeminiInstance]);

  const loadChat = useCallback(async (id: number, allHistories: ChatHistory[]) => {
      const historyToLoad = allHistories.find(h => h.id === id);
      if (historyToLoad) {
          setMessages(historyToLoad.messages);
          setCurrentChatId(id);
          localStorage.setItem('vns-lastChatId', String(id));
          initializeGeminiInstance(historyToLoad.messages);
          setIsHistoryOpen(false);
      } else {
          await startNewChat();
      }
  }, [initializeGeminiInstance, startNewChat]);

  const loadAllHistories = useCallback(async () => {
    const histories = await getAllChatHistories();
    setChatHistories(histories.map(h => ({
        id: h.id,
        title: h.messages.find(m => m.role === 'user')?.content.substring(0, 40) || t('untitledChat', language),
    })));

    const lastChatIdStr = localStorage.getItem('vns-lastChatId');
    if (lastChatIdStr) {
        const lastChatId = Number(lastChatIdStr);
        if (histories.some(h => h.id === lastChatId)) {
            await loadChat(lastChatId, histories);
            return;
        }
    }
    
    if (histories.length > 0) {
        await loadChat(histories[0].id, histories);
    } else {
        await startNewChat();
    }
  }, [loadChat, startNewChat, t, language]);

  useEffect(() => {
    if (isAvailable) {
        loadAllHistories();
    }
  }, [isAvailable, loadAllHistories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (historyPanelRef.current && !historyPanelRef.current.contains(event.target as Node)) {
            setIsHistoryOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || !chat) return;

    const userMessage: Message = { role: 'user', content: userInput };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const textToSend = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: textToSend });
      const aiMessage: Message = { role: 'model', content: response.text };
      const newMessages = [...currentMessages, aiMessage];
      setMessages(newMessages);

      if (currentChatId === null) {
          const newId = await addChatHistory(newMessages);
          setCurrentChatId(newId);
          localStorage.setItem('vns-lastChatId', String(newId));
          setChatHistories(prev => [{ id: newId, title: userMessage.content.substring(0, 40) }, ...prev]);
      } else {
          await updateChatHistory(currentChatId, newMessages);
      }

    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage: Message = { role: 'model', content: t('aiError', language) };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteHistory = async (id: number) => {
    if (window.confirm(t('confirmDeleteChat', language))) {
        await deleteChatHistory(id);
        setChatHistories(prev => prev.filter(h => h.id !== id));
        if (currentChatId === id) {
            await loadAllHistories();
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = [
    { key: 'suggestion.character', prompt: t('suggestion.character', language) },
    { key: 'suggestion.plot', prompt: t('suggestion.plot', language) },
    { key: 'suggestion.scene', prompt: t('suggestion.scene', language) },
  ];

  const handleSuggestionClick = (prompt: string) => {
    setUserInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col flex-1 bg-background border-2 border-dashed border-border rounded-lg min-h-0">
      <div className="flex justify-end items-center p-2 flex-shrink-0 border-b border-border">
        <div className="flex items-center gap-2">
           <div className="relative" ref={historyPanelRef}>
              <button onClick={() => setIsHistoryOpen(prev => !prev)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground" title={t('chatHistory', language)} disabled={!isAvailable}>
                  <HistoryIcon className="w-5 h-5" />
              </button>
              {isHistoryOpen && (
                <div className="absolute top-full right-0 mt-2 z-20 w-72 bg-card border border-border rounded-lg shadow-xl animate-fade-in-fast">
                    <div className="p-2 font-semibold text-sm border-b border-border text-foreground">{t('chatHistory', language)}</div>
                    <ul className="py-1 max-h-80 overflow-y-auto">
                        {chatHistories.length > 0 ? (
                            chatHistories.map(hist => (
                                <li key={hist.id} className="group flex items-center justify-between text-sm hover:bg-secondary">
                                    <button onClick={() => { const histories = getAllChatHistories(); histories.then(h => loadChat(hist.id, h)) }} className="flex-1 text-left px-3 py-2 truncate text-foreground">
                                        {hist.title}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteHistory(hist.id); }} className="ml-2 mr-2 p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" title={t('delete', language)}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-4 text-sm text-muted-foreground text-center">No history yet.</li>
                        )}
                    </ul>
                </div>
              )}
           </div>
           <button onClick={startNewChat} className="p-2 rounded-full hover:bg-secondary text-muted-foreground" title={t('startNewChat', language)} disabled={!isAvailable}>
                <PlusIcon className="w-5 h-5" />
           </button>
        </div>
      </div>
      
      {!isAvailable ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center bg-background rounded-md border border-border p-6">
                <h3 className="text-lg font-semibold">{t('aiUnavailable', language)}</h3>
                <p className="text-muted-foreground mt-2">{t('aiUnavailableHint', language)}</p>
            </div>
          </div>
      ) : (
        <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {msg.role === 'model' ? (
                    <div
                        className="prose prose-sm max-w-none text-card-foreground prose-p:text-card-foreground prose-li:text-card-foreground prose-headings:text-card-foreground"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.content)) }}
                    />
                    ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg px-4 py-2 bg-secondary text-secondary-foreground">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
                <div className="px-4 pb-2 flex-shrink-0">
                    <p className="text-xs text-muted-foreground mb-2">{t('suggestions', language)}</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map(s => (
                            <button 
                                key={s.key} 
                                onClick={() => handleSuggestionClick(s.prompt)} 
                                className="px-3 py-1 bg-secondary hover:bg-secondary-hover text-secondary-foreground text-sm rounded-full transition-colors"
                            >
                                {s.prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-border flex-shrink-0">
            <div className="relative">
                <Textarea
                ref={textareaRef}
                placeholder={t('askAiAssistant', language)}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="pr-12 resize-none max-h-32"
                disabled={isLoading}
                />
                <Button
                size="sm"
                className="absolute right-2 bottom-2 !p-2 h-8 w-8"
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                title={t('send', language)}
                >
                <SendIcon className="w-4 h-4" />
                </Button>
            </div>
            </div>
        </>
      )}
    </div>
  );
};
