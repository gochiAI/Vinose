import React, { useState, useEffect } from 'react';
import { Asset } from '../../types';
import { Image as ImageIcon, Search } from 'lucide-react';
import { Modal } from './Modal';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  assets: Asset[];
  title?: string;
  initialFilter?: ImageFilterType;
  selectedUrl?: string;
}

type ImageFilterType = 'all' | 'bg' | 'cg' | 'sprite';

export const AssetPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  assets,
  title = 'Select Image from Library',
  initialFilter = 'all',
  selectedUrl,
}: AssetPickerModalProps) => {
  const [filter, setFilter] = useState<ImageFilterType>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // 再オープン時に初期フィルターを反映
  useEffect(() => {
    if (isOpen) {
      setFilter(initialFilter);
    }
  }, [initialFilter, isOpen]);

  // 画像アセットのみをフィルタリング
  const imageAssets = assets.filter(asset => asset.type === 'image');

  const filteredAssets = imageAssets.filter((asset) => {
    const matchesFilter = filter === 'all' || asset.subtype === filter;
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-gray-200 dark:border-white/10">
            {(['all', 'bg', 'cg', 'sprite'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap capitalize ${
                  filter === f
                    ? 'bg-white dark:bg-surface-darker text-primary shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'bg' ? 'BG' : f === 'cg' ? 'CG' : 'Sprite'}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Asset Grid */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                <ImageIcon size={32} />
              </div>
              <p className="text-sm font-bold">
                {imageAssets.length === 0 ? 'No images in library' : 'No matching images found'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                {imageAssets.length === 0
                  ? 'Upload images in the Assets page first'
                  : 'Try changing filters or search criteria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleSelect(asset.url)}
                  className={`group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedUrl === asset.url ? 'border-primary ring-2 ring-primary/40' : 'border-transparent hover:border-primary'
                  }`}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <span className="text-white text-xs font-bold text-center line-clamp-2">
                      {asset.name}
                    </span>
                    <span className="text-primary text-[10px] font-bold uppercase bg-black/50 px-2 py-0.5 rounded">
                      {asset.subtype}
                    </span>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-sm uppercase">
                    {asset.subtype}
                  </div>

                  {selectedUrl === asset.url && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-2 border-2 border-primary rounded-lg"></div>
                      <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded-full shadow">Selected</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
