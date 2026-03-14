import React, { useState, useEffect } from 'react';
import { SceneNode } from '../../types';
import { X, Play, RotateCcw } from 'lucide-react';

interface PlaytestOverlayProps {
  nodes: SceneNode[];
  startNodeId?: string;
  onClose: () => void;
}

interface GameState {
  background: string;
  bgm: string;
  character: string | null;
  text: string;
  speaker: string;
  choices: { text: string; target: string }[];
}

export const PlaytestOverlay = ({ nodes, startNodeId, onClose }: PlaytestOverlayProps) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(startNodeId || nodes[0]?.id || '');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [lines, setLines] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    background: '',
    bgm: '',
    character: null,
    text: '',
    speaker: '',
    choices: []
  });

   const currentNode = nodes.find(n => n.id === currentNodeId) || nodes[0];
   const [canProcess, setCanProcess] = useState(false);

   // Parse script into simple lines when node changes
   useEffect(() => {
      

      // いったん停止状態にしてから初期化
      setCanProcess(false);
      setLines([]);
      setCurrentLineIndex(0);
      setGameState(prev => ({ ...prev, text: '', speaker: '', choices: [] }));

      if (currentNode?.script) {
         const parsedLines = currentNode.script.split('\n').filter(l => l.trim() !== '');
         
         setLines(parsedLines);
         setCanProcess(true);
         // 背景とBGMを引き継ぐ
         if (currentNode.background) {
            setGameState(prev => ({ ...prev, background: currentNode.background || prev.background }));
         }
         if (currentNode.bgm) {
            setGameState(prev => ({ ...prev, bgm: currentNode.bgm || prev.bgm }));
         }
      }
   }, [currentNode]);

   // Execute current line
   useEffect(() => {
      if (!canProcess) {
         
         return;
      }
      
      if (lines.length === 0) return;
      if (currentLineIndex >= lines.length) {
        
        // シーンの終わり - nextIdsがあれば自動的に次のシーンへ
        if (currentNode?.nextIds && currentNode.nextIds.length > 0) {
          const nextNodeId = currentNode.nextIds[0];
          
               setCanProcess(false);
               setCurrentLineIndex(0);
               setLines([]);
          setTimeout(() => {
            setCurrentNodeId(nextNodeId);
          }, 1000);
          setGameState(prev => ({ ...prev, text: "(次のシーンへ...)", choices: [] }));
        } else {
          
          setGameState(prev => ({ ...prev, text: "(シーン終了)", choices: [] }));
        }
        return;
    }

    const line = lines[currentLineIndex].trim();
    
    
    // Command Processing
    if (line.startsWith('[')) {
      if (line.includes('BG:')) {
         const assetName = line.match(/\[BG: (.*?)\]/)?.[1];
         const asset = null; // Placeholder for background asset lookup
         if (asset) setGameState(prev => ({ ...prev, background: asset.url }));
         autoAdvance();
      } else if (line.includes('BGM:')) {
         // Placeholder for BGM
         autoAdvance();
      } else if (line.includes('CHOICE')) {
         
         // Gather next lines as choices
         const choices = [];
         let i = currentLineIndex + 1;
         while(i < lines.length) {
            const nextLine = lines[i];
            if (nextLine.includes('=>')) {
               const parts = nextLine.split('=>');
               choices.push({ text: parts[0].replace(/^\d+\.\s*/, '').trim(), target: parts[1].trim() });
            } else {
               break;
            }
            i++;
         }
         
         setGameState(prev => ({ ...prev, choices, text: '' }));
         // 選択肢を表示中は停止（選択されるまで待つ）
         // Don't auto advance, wait for user input
      } else if (line.includes('GOTO:')) {
          const targetId = line.match(/\[GOTO:\s*([^\]]+)\]/)?.[1]?.trim();
          if (targetId) {
                  setCanProcess(false);
                  setCurrentLineIndex(0);
                  setLines([]);
            setTimeout(() => {
                     setCurrentNodeId(targetId);
            }, 500);
            setGameState(prev => ({ ...prev, text: "(シーン遷移中...)", choices: [] }));
          }
      } else if (line.startsWith('[IF:')) {
          // Skip logic for visual preview, just show it
          autoAdvance();
      } else {
          // Generic SFX or Action
          autoAdvance();
      }
    } 
    // Character Name
    else if (line === line.toUpperCase() && !line.includes(' ')) {
       setGameState(prev => ({ ...prev, speaker: line }));
       // Find character to show sprite if applicable
       const char = initialCharacters.find(c => c.name.toUpperCase() === line);
       if (char) {
         setGameState(prev => ({ ...prev, character: char.avatarUrl }));
       } else {
         setGameState(prev => ({ ...prev, character: null }));
       }
       autoAdvance();
    } 
    // Dialogue
    else {
       setGameState(prev => ({ ...prev, text: line }));
       // This is a stopping point (text display)
    }

   }, [currentLineIndex, lines, currentNode, canProcess]);

  const autoAdvance = () => {
     setTimeout(() => {
        if (currentLineIndex < lines.length - 1) {
            setCurrentLineIndex(prev => prev + 1);
        }
     }, 10);
  };

  const handleNext = () => {
    if (gameState.choices.length > 0) return; // Block on choice
    if (currentLineIndex < lines.length) {
        setCurrentLineIndex(prev => prev + 1);
    }
  };

   const handleChoiceSelect = (targetId: string) => {
      
      // 即座に選択肢を非表示にする
      setGameState(prev => ({ ...prev, choices: [], text: '(シーン遷移中...)' }));
      setCanProcess(false);
      setCurrentLineIndex(0);
      setLines([]);
      // 少し遅延させてから次のシーンへ
      setTimeout(() => {
         
         setCurrentNodeId(targetId);
      }, 300);
   };

  const handleRestart = () => {
    
    setCurrentNodeId(startNodeId || nodes[0]?.id || '');
    setCurrentLineIndex(0);
    setGameState({
      background: '',
      bgm: '',
      character: null,
      text: '',
      speaker: '',
      choices: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
      <div className="relative w-full max-w-[1280px] aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
         
         {/* Background Layer */}
         {gameState.background && (
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url('${gameState.background}')` }}></div>
         )}
         
         {/* Character Layer */}
         {gameState.character && (
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
               <div className="w-[400px] h-[500px] bg-cover bg-top animate-in slide-in-from-bottom-10 fade-in duration-500" style={{ backgroundImage: `url('${gameState.character}')` }}></div>
            </div>
         )}

         {/* UI Layer */}
         <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8" onClick={gameState.choices.length === 0 ? handleNext : undefined}>
            {/* Header / Controls */}
            <div className="flex justify-between items-start">
               <div className="bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm font-bold border border-white/20 shadow-lg">
                  <span className="text-primary">▶</span> PLAYTEST • {currentNode?.title || 'Unknown'}
               </div>
               <div className="flex gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handleRestart(); }} className="p-2.5 bg-black/70 hover:bg-white/20 text-white rounded-full transition-all shadow-lg border border-white/10 hover:border-white/30"><RotateCcw size={20} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-all shadow-lg border border-red-400/30"><X size={20} /></button>
               </div>
            </div>

            {/* Choices */}
            {gameState.choices.length > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-md z-20 p-8">
                  <div className="mb-4 text-white/80 text-sm font-medium tracking-wide">選択してください</div>
                  {gameState.choices.map((choice, idx) => (
                     <button 
                       key={idx}
                       className="w-full max-w-[700px] py-5 px-8 bg-gradient-to-r from-slate-800/95 to-slate-700/95 hover:from-primary hover:to-primary/80 border-2 border-primary/40 hover:border-primary text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-[1.02] transition-all duration-200 hover:shadow-primary/30"
                       onClick={(e) => { e.stopPropagation(); handleChoiceSelect(choice.target); }}
                     >
                        <span className="text-primary/70 mr-3">▸</span>{choice.text}
                     </button>
                  ))}
               </div>
            )}

            {/* Dialogue Box */}
            {(gameState.text || gameState.speaker) && gameState.choices.length === 0 && (
               <div className="mt-auto mb-6 md:mb-8 mx-auto w-full max-w-4xl min-h-[140px] bg-gradient-to-b from-slate-900/95 to-slate-800/95 border-2 border-white/30 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative animate-in slide-in-from-bottom-4">
                  {gameState.speaker && (
                     <div className="absolute -top-6 left-6 bg-gradient-to-r from-primary to-primary/80 px-6 py-2 rounded-t-xl rounded-br-xl text-white font-bold shadow-xl border-2 border-white/30 text-base md:text-lg tracking-wide">
                        {gameState.speaker}
                     </div>
                  )}
                  <p className="text-lg md:text-xl text-white leading-relaxed font-medium drop-shadow-lg">
                     {gameState.text}
                  </p>
                  <div className="absolute bottom-5 right-5 animate-bounce text-primary/80">
                     <Play size={20} fill="currentColor" className="rotate-90" />
                  </div>
               </div>
            )}
         </div>

      </div>
    </div>
  );
};