import React from 'react';
import { Image as ImageIcon, Music } from 'lucide-react';
import { Asset, MediaContent } from '../../../types';

interface MediaBlockProps {
  content: MediaContent;
  onChange: (content: MediaContent) => void;
  assets: Asset[];
}

export const MediaBlock = ({ content, onChange, assets }: MediaBlockProps) => {
  const isBgm = content.category === 'bgm';
  const isSe = content.category === 'se';
  const isBackground = content.category === 'background';
  const bgAsset = assets.find(a => a.id === content.assetId && a.type === 'image');

  const mediaOptions = assets.filter(a => {
    if (content.category === 'background') return a.type === 'image' && a.subtype === 'bg';
    if (content.category === 'sprite') return a.type === 'image' && a.subtype === 'sprite';
    if (content.category === 'bgm') return a.type === 'audio' && a.subtype === 'bgm';
    if (content.category === 'se') return a.type === 'audio' && a.subtype === 'se';
    return false;
  });

  return (
    <div className={`p-3 rounded-lg border flex items-center gap-4 relative overflow-hidden transition-colors ${isBgm ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
       {bgAsset?.url && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url('${bgAsset.url}')` }}></div>
       )}
       
       <div className="flex flex-col gap-2 z-10">
           <button 
             onClick={() => onChange({ ...content, category: 'background', assetId: '' })}
             className={`p-2 rounded transition-colors ${isBackground ? 'bg-green-500 text-white shadow' : 'text-gray-500 hover:text-white'}`}
             title="Background Image"
           >
              <ImageIcon size={18} />
           </button>
           <button 
             onClick={() => onChange({ ...content, category: 'bgm', assetId: '' })}
             className={`p-2 rounded transition-colors ${isBgm ? 'bg-indigo-500 text-white shadow' : 'text-gray-500 hover:text-white'}`}
             title="Background Music"
           >
              <Music size={18} />
           </button>
       </div>

       <div className="flex-1 relative z-10">
          <label className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${isBgm || isSe ? 'text-indigo-300' : 'text-green-300'}`}>
              {isBgm || isSe ? 'Select Audio' : content.category === 'sprite' ? 'Select Sprite' : 'Select Background'}
          </label>
          <select 
             className="w-full bg-surface-darker/50 backdrop-blur rounded text-white text-sm border border-gray-700 p-2 focus:ring-0 cursor-pointer font-medium"
             value={content.assetId}
             onChange={(e) => onChange({ ...content, assetId: e.target.value })}
          >
            <option value="">(None)</option>
            {mediaOptions.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
       </div>
    </div>
  );
};