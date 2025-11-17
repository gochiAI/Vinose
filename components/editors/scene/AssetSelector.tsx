import React from 'react';
import { ProjectData, AssetType } from '../../../types';
import { useSettings } from '../../../contexts/SettingsContext';

export const AssetSelector: React.FC<{
    assetType: AssetType;
    label: string;
    selectedValue: string | undefined;
    onValueChange: (newValue: string) => void;
    projectData: ProjectData;
    disabled?: boolean;
}> = ({ assetType, label, selectedValue, onValueChange, projectData, disabled }) => {
    const { t, language } = useSettings();
    const filteredAssets = projectData.assets.filter(a => a.type === assetType);
    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
            <select
                value={selectedValue || ''}
                disabled={disabled}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-ring focus:border-ring outline-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
                <option value="">({t('none', language)})</option>
                {filteredAssets.length === 0 && <option disabled>{t('noAssetsOfType', language)}</option>}
                {filteredAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
            </select>
        </div>
    );
}
