import React, { useState, useRef, useEffect } from "react";
import { Asset } from "../../types";
import { Image, Music, Volume2, Search, Filter, Upload } from "lucide-react";
import { ActionEvent } from "../../App";

import { Modal } from "../common/Modal";
import { Input, Label, Select } from "../common/Form";
import { ConfirmDialog } from "../common/ConfirmDialog";

type FilterType = "all" | "bg" | "cg" | "sprite" | "bgm" | "se" | "voice";

interface AssetsPageProps {
  lastAction: ActionEvent | null;
  language?: string;
}

export const AssetsPage = ({
  lastAction,
  language = "en",
}: AssetsPageProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetsRef = useRef(assets);

  useEffect(() => {
    if (lastAction?.type === "UPLOAD_ASSET") {
      fileInputRef.current?.click();
    }
  }, [lastAction]);

  // assetsRefを常に最新の状態に保つ
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  // クリーンアップ: コンポーネントのアンマウント時のみ、すべてのblob URLを解放
  useEffect(() => {
    return () => {
      assetsRef.current.forEach(asset => {
        if (asset.url.startsWith('blob:')) {
          URL.revokeObjectURL(asset.url);
        }
      });
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload and create object URL
    const objectUrl = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const now = new Date().toISOString();

    if (isImage) {
      // 画像の場合: Imageオブジェクトで実際のwidth/heightを取得
      const img = new window.Image();
      img.onload = () => {
        const newAsset: Asset = {
          id: Date.now().toString(),
          name: file.name,
          type: "image",
          subtype: "bg",
          url: objectUrl,
          createdAt: now,
          metadata: {
            width: img.width,
            height: img.height,
            format: file.type,
          },
        };
        setAssets((prev) => [newAsset, ...prev]);
        setEditingAsset(newAsset);
      };
      img.src = objectUrl;
    } else {
      // 音声アセットとして作成
      const newAsset: Asset = {
        id: Date.now().toString(),
        name: file.name,
        type: "audio",
        subtype: "se",
        url: objectUrl,
        createdAt: now,
        metadata: {
          duration: 0,
          format: file.type,
        },
      };
      setAssets((prev) => [newAsset, ...prev]);
      setEditingAsset(newAsset);
    }

    // Clear input
    e.target.value = "";
  };

  const handleSaveAsset = () => {
    if (!editingAsset) return;
    setAssets((prev) =>
      prev.map((a) => (a.id === editingAsset.id ? editingAsset : a)),
    );
    setEditingAsset(null);
  };

  const handleDeleteAsset = () => {
    if (!editingAsset) return;
    
    // メモリ解放
    if (editingAsset.url.startsWith('blob:')) {
      URL.revokeObjectURL(editingAsset.url);
    }
    
    setAssets(prev => prev.filter(a => a.id !== editingAsset.id));
    setEditingAsset(null);
    setShowDeleteConfirm(false);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = filter === "all" || asset.subtype === filter;
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,audio/*"
      />

      {/* Filters & Search Toolbar */}
      <div className="p-6 pb-2 flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-inherit z-20">
        <div className="flex bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-gray-200 dark:border-white/10 overflow-x-auto max-w-[60%]">
          {(["all", "bg", "cg", "sprite", "bgm", "se", "voice"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f as FilterType)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap capitalize ${filter === f ? "bg-white dark:bg-surface-darker text-primary shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {f === "all"
                  ? "All"
                  : f === "se"
                    ? "SE"
                    : f === "bg"
                      ? "BG"
                      : f === "cg"
                        ? "CG"
                        : f === "bgm"
                          ? "BGM"
                          : f === "voice"
                            ? "Voice"
                            : f}
              </button>
            ),
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none text-gray-900 dark:text-white w-64"
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {/* Upload Placeholder */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-50 dark:bg-surface-dark border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 p-6 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors min-h-[200px] text-gray-400 hover:text-primary group"
          >
            <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5 group-hover:bg-primary/10 transition-colors">
              <Upload size={32} />
            </div>
            <p className="text-sm font-bold">Upload New Asset</p>
          </div>

          {/* Empty State Message */}
          {filteredAssets.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                {assets.length === 0 ? (
                  <Upload size={32} />
                ) : (
                  <Filter size={32} />
                )}
              </div>
              <p className="text-sm font-bold">
                {assets.length === 0
                  ? language === "ja"
                    ? "まだアセットがアップロードされていません"
                    : "No assets uploaded yet"
                  : language === "ja"
                    ? "該当するファイルがありません"
                    : "No matching files found"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                {assets.length === 0
                  ? language === "ja"
                    ? "上のボタンをクリックしてファイルをアップロードしてください"
                    : "Click the button above to upload files"
                  : language === "ja"
                    ? "フィルターや検索条件を変更してみてください"
                    : "Try changing filters or search criteria"}
              </p>
            </div>
          )}

          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setEditingAsset(asset)}
              className="group bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden hover:border-primary dark:hover:border-primary transition-all hover:shadow-lg cursor-pointer flex flex-col"
            >
              {/* Thumbnail Area */}
              <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center">
                {asset.type === "image" ? (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex flex-col items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                    {asset.subtype === "bgm" ? (
                      <Music size={32} className="text-purple-300" />
                    ) : (
                      <Volume2 size={32} className="text-blue-300" />
                    )}
                    <div className="flex items-end gap-1 h-8 items-center">
                      <div className="w-1 h-3 bg-white/20 rounded animate-pulse"></div>
                      <div className="w-1 h-6 bg-white/40 rounded animate-pulse delay-75"></div>
                      <div className="w-1 h-4 bg-white/30 rounded animate-pulse delay-150"></div>
                      <div className="w-1 h-8 bg-white/50 rounded animate-pulse delay-300"></div>
                      <div className="w-1 h-5 bg-white/20 rounded animate-pulse delay-75"></div>
                    </div>
                  </div>
                )}

                {/* Overlay Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded backdrop-blur">
                    Edit Info
                  </span>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm uppercase">
                  {asset.subtype}
                </div>
              </div>

              {/* Info Area */}
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-gray-200 truncate group-hover:text-primary transition-colors">
                    {asset.name}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        title="Asset Details"
        maxWidth="max-w-lg"
        footer={
          editingAsset && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300 font-bold px-4 py-2 hover:bg-red-900/20 rounded"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsset}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded shadow-lg shadow-primary/20"
                >
                  Save Asset
                </button>
              </div>
            </>
          )
        }
      >
        {editingAsset && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="w-full h-48 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 mb-4">
              {editingAsset.type === "image" && editingAsset.url ? (
                <img
                  src={editingAsset.url}
                  className="h-full w-full object-contain"
                  alt="preview"
                />
              ) : editingAsset.type === "audio" && editingAsset.url ? (
                <div className="text-gray-300 flex flex-col items-center gap-3">
                  {editingAsset.subtype === "bgm" ? (
                    <Music size={48} className="text-purple-400" />
                  ) : (
                    <Volume2 size={48} className="text-blue-400" />
                  )}
                  <audio controls className="w-full max-w-xs">
                    <source src={editingAsset.url} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  {editingAsset.type === "audio" ? (
                    <Volume2 size={48} />
                  ) : (
                    <Image size={48} />
                  )}
                  <span className="text-xs mt-2">No Preview Available</span>
                </div>
              )}
            </div>

            <div>
              <Label>File Name</Label>
              <Input
                type="text"
                value={editingAsset.name}
                onChange={(e) =>
                  setEditingAsset({ ...editingAsset, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Media Type</Label>
                <Select
                  value={editingAsset.type}
                  onChange={(e) => {
                    const newType = e.target.value as "image" | "audio";
                    // 型に応じて新しいアセットオブジェクトを作成
                    if (newType === "image") {
                      setEditingAsset({
                        ...editingAsset,
                        type: "image",
                        subtype: "bg",
                        metadata: {
                          width: editingAsset.type === "image" ? editingAsset.metadata?.width || 0 : 0,
                          height: editingAsset.type === "image" ? editingAsset.metadata?.height || 0 : 0,
                          format: editingAsset.type === "image" ? editingAsset.metadata?.format || "" : "",
                        },
                      });
                    } else {
                      setEditingAsset({
                        ...editingAsset,
                        type: "audio",
                        subtype: "bgm",
                        metadata: {
                          duration: editingAsset.type === "audio" ? editingAsset.metadata?.duration || 0 : 0,
                          format: editingAsset.type === "audio" ? editingAsset.metadata?.format || "" : "",
                        },
                      });
                    }
                  }}
                >
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                </Select>
              </div>
              <div>
                <Label>Asset Category</Label>
                <Select
                  value={editingAsset.subtype}
                  onChange={(e) =>
                    setEditingAsset({
                      ...editingAsset,
                      subtype: e.target.value as any,
                    })
                  }
                >
                  {editingAsset.type === "image" ? (
                    <>
                      <option value="bg">Background (BG)</option>
                      <option value="cg">Event CG</option>
                      <option value="sprite">Character Sprite</option>
                    </>
                  ) : (
                    <>
                      <option value="bgm">Background Music</option>
                      <option value="se">Sound Effect (SE)</option>
                      <option value="voice">Voice Line</option>
                    </>
                  )}
                </Select>
              </div>
            </div>

            <div>
              <Label>URL / Path</Label>
              <Input
                type="text"
                className="text-xs font-mono"
                value={editingAsset.url}
                onChange={(e) =>
                  setEditingAsset({ ...editingAsset, url: e.target.value })
                }
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAsset}
        title="Delete Asset"
        message="Are you sure you want to delete this asset?"
        description="This action cannot be undone and the file will be removed from memory."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      >
        {editingAsset && (
          <div className="flex items-center gap-3 p-3 bg-black/20 rounded border border-gray-700">
            <div className="size-12 rounded-lg bg-gray-700 bg-cover bg-center shrink-0 flex items-center justify-center" 
                 style={{ backgroundImage: editingAsset.type === "image" ? `url('${editingAsset.url}')` : undefined }}>
              {editingAsset.type === "audio" ? (
                editingAsset.subtype === "bgm" ? (
                  <Music size={24} className="text-purple-400" />
                ) : (
                  <Volume2 size={24} className="text-blue-400" />
                )
              ) : !editingAsset.url && (
                <Image size={24} className="text-gray-500" />
              )}
            </div>
            <div>
              <div className="font-bold text-white">{editingAsset.name}</div>
              <div className="text-sm text-gray-400 uppercase">{editingAsset.subtype}</div>
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};
