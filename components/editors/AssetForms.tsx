import React, { useRef } from 'react';
import { EditableItem, DbItemType, Asset, AssetType } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const AssetEditor: React.FC<{
    item: { type: 'asset', data: Asset };
    onUpdate: (item: EditableItem) => void;
    onDeleteItem: (type: DbItemType, id: string) => void;
    onClose: () => void;
}> = ({ item, onUpdate, onDeleteItem, onClose }) => {
    const { t, language } = useSettings();
    const asset = item.data;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = () => {
        if(window.confirm(t('confirmDelete', language).replace('{name}', asset.name))){
            onDeleteItem(item.type, asset.id);
            onClose();
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            onUpdate({ 
                ...item, 
                data: { 
                    ...asset, 
                    data: dataUrl, 
                    mimeType: file.type,
                } 
            });
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset file input
    };

    return (
        <div className="p-4 space-y-4">
            <Input
                label={t('assetName', language)}
                value={asset.name}
                onChange={(e) => onUpdate({ ...item, data: { ...asset, name: e.target.value } })}
            />
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('assetType', language)}</label>
                 <select
                    value={asset.type}
                    onChange={(e) => onUpdate({ ...item, data: { ...asset, type: e.target.value as AssetType } })}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {Object.values(AssetType).map(type => (
                        <option key={type} value={type}>{t(type.toLowerCase() as any, language)}</option>
                    ))}
                 </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('assetPreview', language)}</label>
                <div className="w-full p-2 bg-background border border-border rounded-md min-h-[100px] flex items-center justify-center">
                    {asset.data ? (
                      asset.mimeType.startsWith('image/') ? (
                          <img src={asset.data} alt={asset.name} className="max-w-full max-h-64 object-contain" />
                      ) : asset.mimeType.startsWith('audio/') ? (
                          <audio controls src={asset.data} />
                      ) : (
                          <p className="text-sm text-muted-foreground">{t('noPreview', language)}</p>
                      )
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-sm text-muted-foreground">{t('noFileUploaded', language)}</p>
                            <Button variant="secondary" size="sm" className="mt-2" onClick={handleUploadClick}>
                                {t('uploadFile', language)}...
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept={asset.type === AssetType.SFX ? 'audio/*' : 'image/*'}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="pt-4">
                 <Button variant="danger" onClick={handleDelete} className="w-full">
                    {t('delete', language)} {t(item.type, language)}
                 </Button>
            </div>
        </div>
    );
};

export const AssetViewer: React.FC<{
    item: { type: 'asset', data: Asset };
}> = ({ item }) => {
    const { t, language } = useSettings();
    const asset = item.data;

    return (
        <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('assetName', language)}</h3>
            <p className="text-2xl font-bold text-foreground -mt-2">{asset.name}</p>

            <h3 className="text-sm font-semibold text-muted-foreground">{t('assetType', language)}</h3>
            <p className="text-foreground -mt-2">{t(asset.type.toLowerCase() as any, language)}</p>

            <h3 className="text-sm font-semibold text-muted-foreground">{t('assetPreview', language)}</h3>
            <div className="w-full p-2 bg-background border border-border rounded-md min-h-[100px] flex items-center justify-center">
                {asset.data ? (
                    asset.mimeType.startsWith('image/') ? (
                        <img src={asset.data} alt={asset.name} className="max-w-full max-h-64 object-contain" />
                    ) : asset.mimeType.startsWith('audio/') ? (
                        <audio controls src={asset.data} className="w-full" />
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('noPreview', language)}</p>
                    )
                ) : (
                    <p className="text-sm text-muted-foreground">{t('noFileUploaded', language)}</p>
                )}
            </div>
        </div>
    );
};
