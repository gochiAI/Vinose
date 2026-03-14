import React from 'react';
import { Image as ImageIcon, Music } from 'lucide-react';


interface MediaBlockProps {
  content: {
    subType: 'bg' | 'bgm';
    asset: string;
  };
  onChange: (content: any) => void;
}

export const MediaBlock = ({ content, onChange }: MediaBlockProps) => {
  const isBgm = content.subType === 'bgm';
  const bgAsset =null;
  return (
    <div className={`p-3 rounded-lg border flex items-center gap-4 relative overflow-hidden transition-colors ${isBgm ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
       {bgAsset?.url && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url('${bgAsset.url}')` }}></div>
       )}
       
       <div className="flex flex-col gap-2 z-10">
           <button 
             onClick={() => onChange({ ...content, subType: 'bg' })}
             className={`p-2 rounded transition-colors ${!isBgm ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:text-white'}`}
             title="Background Image"
           >
              <ImageIcon size={18} />
           </button>
           <button 
             onClick={() => onChange({ ...content, subType: 'bgm' })}
             className={`p-2 rounded transition-colors ${isBgm ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-white'}`}
             title="Background Music"
           >
              <Music size={18} />
           </button>
       </div>

       <div className="flex-1 relative z-10">
          <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isBgm ? 'text-indigo-300' : 'text-green-300'}`}>
              {isBgm ? 'Set Background Music' : 'Set Background Image'}
          </label>
          <select 
             className="w-full bg-surface-darker/50 backdrop-blur rounded text-white text-sm border border-gray-700 p-2 focus:ring-0 cursor-pointer font-medium"
             value={content.asset}
             onChange={(e) => onChange({ ...content, asset: e.target.value })}
          >
            <option value="">(None)</option>
            {/* アセットのオプションをここに動的に追加 */}
          </select>
       </div>
    </div>
  );
};