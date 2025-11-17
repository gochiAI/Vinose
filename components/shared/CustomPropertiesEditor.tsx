import React from 'react';
import { CustomProperty } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';

declare const marked: any;
declare const DOMPurify: any;

export const CustomPropertiesEditor: React.FC<{
    properties: CustomProperty[];
    onUpdateProperties: (newProperties: CustomProperty[]) => void;
}> = ({ properties, onUpdateProperties }) => {
    const { t, language } = useSettings();

    const handleAddProperty = () => {
        const newProperties = [...properties, { id: `prop-${Date.now()}`, key: '', value: '' }];
        onUpdateProperties(newProperties);
    };

    const handlePropertyChange = (id: string, field: 'key' | 'value', newValue: string) => {
        const newProperties = properties.map(p => p.id === id ? { ...p, [field]: newValue } : p);
        onUpdateProperties(newProperties);
    };

    const handleDeleteProperty = (id: string) => {
        const newProperties = properties.filter(p => p.id !== id);
        onUpdateProperties(newProperties);
    };
    
    return (
        <div className="space-y-3">
            <h4 className="text-md font-semibold text-muted-foreground">{t('customProperties', language)}</h4>
            <div className="p-2 bg-background border border-border rounded-md space-y-2">
                {properties.map(prop => (
                    <div key={prop.id} className="flex items-center gap-2">
                        <Input 
                            placeholder={t('key', language)}
                            value={prop.key}
                            onChange={(e) => handlePropertyChange(prop.id, 'key', e.target.value)}
                            className="flex-1"
                        />
                        <Input 
                            placeholder={t('value', language)}
                            value={prop.value}
                            onChange={(e) => handlePropertyChange(prop.id, 'value', e.target.value)}
                            className="flex-1"
                        />
                         <button onClick={() => handleDeleteProperty(prop.id)} className="text-muted-foreground hover:text-danger p-1" title={t('delete', language)}>
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <Button variant="secondary" size="sm" onClick={handleAddProperty} className="w-full">
                    <PlusIcon className="w-4 h-4 mr-1" /> {t('addProperty', language)}
                </Button>
            </div>
        </div>
    );
};

export const CustomPropertiesViewer: React.FC<{
    properties?: CustomProperty[];
}> = ({ properties }) => {
    const { t, language } = useSettings();
    
    if (!properties || properties.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground pt-2">{t('customProperties', language)}</h4>
            <dl className="text-sm bg-background p-3 rounded-md border border-border">
                {properties.map(prop => (
                    <div key={prop.id} className="flex justify-between py-1">
                        <dt className="font-medium text-foreground">{prop.key || `(${t('unnamed', language)})`}:</dt>
                        <dd className="text-muted-foreground text-right">{prop.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};
