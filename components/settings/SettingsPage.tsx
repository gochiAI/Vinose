import React, { useState, useEffect } from 'react';
import { Save, User, Monitor, FileCode, Database } from 'lucide-react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { ProjectInfo } from '../../types';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const db = useDatabase();
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load project info
  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const info = await db.getProjectInfo();
        
        setProjectInfo(info);
        setProjectName(info?.name || '');
      } catch (error) {
        console.error('[SettingsPage] Failed to load project info:', error);
      }
    };
    loadProjectInfo();
  }, [db]);

  const handleSaveProjectName = async () => {
    if (!projectName.trim()) return;
    
    setIsSaving(true);
    setSaveMessage('');
    try {
      const updated = await db.updateProjectInfo(projectName);
      
      setProjectInfo(updated);
      setSaveMessage('Project name saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('[SettingsPage] Failed to update project info:', error);
      setSaveMessage('Failed to save project name');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-white/5 bg-surface-light dark:bg-surface-dark flex flex-col pt-6">
        <div className="px-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manage your project preferences</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            <User size={18} /> General
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'editor' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            <FileCode size={18} /> Editor
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            <Monitor size={18} /> Appearance
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'backup' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            <Database size={18} /> Backup
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                    <input 
                      type="text" 
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author / Studio</label>
                    <input type="text" defaultValue="Creative Studio A" className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                        <input type="text" defaultValue="0.4.2" className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Platform</label>
                        <select className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none">
                           <option>Web (HTML5)</option>
                           <option>Windows</option>
                           <option>MacOS</option>
                           <option>Mobile</option>
                        </select>
                      </div>
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSaveProjectName}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all"
                  >
                    <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {saveMessage && (
                    <span className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {saveMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Editor Preferences</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-white/5">
                         <div>
                            <div className="font-bold text-gray-900 dark:text-white">Auto-Save</div>
                            <div className="text-xs text-gray-500">Automatically save changes every few minutes</div>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer">
                           <input type="checkbox" className="sr-only peer" defaultChecked />
                           <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                         </label>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Script Font Size</label>
                         <select className="w-full bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none">
                            <option>Small (12px)</option>
                            <option selected>Medium (14px)</option>
                            <option>Large (16px)</option>
                            <option>Extra Large (18px)</option>
                         </select>
                      </div>
                   </div>
                </div>
             </div>
          )}
          
          {activeTab === 'appearance' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Theme Settings</h3>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="cursor-pointer group">
                         <div className="aspect-video bg-white border-2 border-gray-300 group-hover:border-primary rounded-lg mb-2 transition-colors"></div>
                         <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">Light</div>
                      </div>
                      <div className="cursor-pointer group">
                         <div className="aspect-video bg-[#141414] border-2 border-primary ring-2 ring-primary/20 rounded-lg mb-2 transition-colors"></div>
                         <div className="text-center text-sm font-bold text-primary">Dark</div>
                      </div>
                      <div className="cursor-pointer group">
                         <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 group-hover:border-primary rounded-lg mb-2 transition-colors"></div>
                         <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">System</div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-surface-dark rounded-xl border border-dashed border-gray-300 dark:border-white/10">
                  <Database size={48} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Local Backup</h3>
                  <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                    Download a full JSON backup of your project file. This includes all scenes, characters, and settings.
                  </p>
                  <button className="px-6 py-2.5 bg-secondary hover:bg-[#a67d42] text-white font-bold rounded-lg shadow-lg shadow-secondary/20 transition-all">
                     Download Backup
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};