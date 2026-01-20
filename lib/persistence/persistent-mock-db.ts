/**
 * Enhanced MockDatabase with persistence support
 */

import { DatabaseAdapter } from '../db/types';
import { SceneNode, ExtendedCharacter, Asset, ScenarioEvent, FileItem, Chapter, ProjectInfo } from '../../types';
import { PersistenceManager } from './storage';
import { DataCache, SyncQueue, PersistenceConfig } from './cache';
import {
  mockChapters,
  chapter1Nodes,
  chaptersMap,
  initialCharacters,
  initialAssets,
  initialEvents,
  initialFiles,
} from '../../data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class PersistentMockDatabase implements DatabaseAdapter {
  private characters: ExtendedCharacter[] = [...initialCharacters];
  private assets: Asset[] = [...initialAssets];
  private events: ScenarioEvent[] = [...initialEvents];
  private files: FileItem[] = [...initialFiles];
  private chapters: Chapter[] = [...mockChapters];
  private nodesMap: Record<string, SceneNode[]> = this.initializeNodesMap();

  private persistence: PersistenceManager;
  private cache: DataCache;
  private syncQueue: SyncQueue;
  private config: PersistenceConfig;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(config: PersistenceConfig = { enabled: true, autoSave: true, autoSaveInterval: 30000 }) {
    this.config = config;
    this.persistence = new PersistenceManager('vinose_db');
    this.cache = new DataCache('vinose_cache');
    this.syncQueue = new SyncQueue(this.persistence);

    if (config.enabled) {
      this.initialize();
    }
  }

  private initializeNodesMap(): Record<string, SceneNode[]> {
    const map: Record<string, SceneNode[]> = {};
    for (const [chapterTitle, nodes] of Object.entries(chaptersMap)) {
      // Deep copy each node to avoid shared references
      map[chapterTitle] = nodes.map(node => ({ ...node }));
    }
    return map;
  }

  private async initialize(): Promise<void> {
    try {
      // Load data from persistence
      const [characters, assets, events, files, chapters, nodesMap] = await Promise.all([
        this.loadCharacters(),
        this.loadAssets(),
        this.loadEvents(),
        this.loadFiles(),
        this.loadChapters(),
        this.loadNodesMap(),
      ]);

      if (characters) this.characters = characters;
      if (assets) this.assets = assets;
      if (events) this.events = events;
      if (files) this.files = files;
      if (chapters) this.chapters = chapters;
      if (nodesMap) this.nodesMap = nodesMap;

      console.log('[PersistentMockDatabase] Initialized with persisted data');

      // Start auto-save if enabled
      if (this.config.autoSave && this.config.autoSaveInterval) {
        this.startAutoSave();
      }
    } catch (error) {
      console.warn('[PersistentMockDatabase] Failed to initialize from persistence:', error);
    }
  }

  private startAutoSave(): void {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);

    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveAll();
      } catch (error) {
        console.warn('[AutoSave] Failed to save data:', error);
      }
    }, this.config.autoSaveInterval);
  }

  private async saveAll(): Promise<void> {
    await Promise.all([
      this.persistence.get('characters') ? this.saveCharactersToStorage() : null,
      this.persistence.get('assets') ? this.saveAssetsToStorage() : null,
      this.persistence.get('events') ? this.saveEventsToStorage() : null,
      this.persistence.get('files') ? this.saveFilesToStorage() : null,
      this.persistence.get('chapters') ? this.saveChaptersToStorage() : null,
      this.persistence.get('nodesMap') ? this.saveNodesMapToStorage() : null,
    ].filter(Boolean));
  }

  async getProjectInfo(): Promise<ProjectInfo | null> {
    await delay(100);
    return { 
      id: '1',
      name: 'Eternal Echoes',
      description: 'A narrative visual novel project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateProjectInfo(name: string, description?: string): Promise<ProjectInfo> {
    await delay(100);
    return {
      id: '1',
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- Chapters & Nodes ---

  async getChapters(): Promise<Chapter[]> {
    await delay(200);
    return [...this.chapters];
  }

  async getNodesForChapter(chapterTitle: string): Promise<SceneNode[]> {
    await delay(300);
    return this.nodesMap[chapterTitle] ? [...this.nodesMap[chapterTitle]] : [];
  }

  async saveNode(node: SceneNode): Promise<void> {
    await delay(100);
    
    // Update node in memory
    const chapterTitle = node.chapterId || this.findChapterByNodeId(node.id);
    if (chapterTitle && this.nodesMap[chapterTitle]) {
      const index = this.nodesMap[chapterTitle].findIndex(n => n.id === node.id);
      if (index >= 0) {
        this.nodesMap[chapterTitle][index] = { ...node };
      }
    }

    if (this.config.enabled) {
      try {
        await this.cache.set(`node_${node.id}`, node);
        await this.syncQueue.add('save', 'SceneNode', node, node.id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to save node:', error);
      }
    }
  }

  async createNode(node: SceneNode): Promise<void> {
    await delay(100);
    
    // Add node to memory
    const chapterTitle = node.chapterId || Object.keys(this.nodesMap)[0];
    if (!this.nodesMap[chapterTitle]) {
      this.nodesMap[chapterTitle] = [];
    }
    if (!this.nodesMap[chapterTitle].find(n => n.id === node.id)) {
      this.nodesMap[chapterTitle].push({ ...node });
    }

    if (this.config.enabled) {
      try {
        await this.cache.set(`node_${node.id}`, node);
        await this.syncQueue.add('create', 'SceneNode', node, node.id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to create node:', error);
      }
    }
  }

  private findChapterByNodeId(nodeId: string): string | null {
    for (const [chapterTitle, nodes] of Object.entries(this.nodesMap)) {
      if (nodes.find(n => n.id === nodeId)) {
        return chapterTitle;
      }
    }
    return null;
  }

  // --- Characters ---

  async getCharacters(): Promise<ExtendedCharacter[]> {
    const cached = await this.cache.get<ExtendedCharacter[]>('characters');
    if (cached) return cached;

    await delay(200);
    const result = [...this.characters];

    if (this.config.enabled) {
      await this.cache.set('characters', result);
    }

    return result;
  }

  async saveCharacter(character: ExtendedCharacter): Promise<void> {
    await delay(200);
    const index = this.characters.findIndex(c => c.id === character.id);
    if (index >= 0) {
      this.characters[index] = character;
    } else {
      this.characters.push(character);
    }

    if (this.config.enabled) {
      try {
        await this.cache.set(`character_${character.id}`, character);
        await this.cache.set('characters', this.characters);
        await this.syncQueue.add('save', 'ExtendedCharacter', character, character.id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to save character:', error);
      }
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    await delay(100);
    this.characters = this.characters.filter(c => c.id !== id);

    if (this.config.enabled) {
      try {
        await this.cache.remove(`character_${id}`);
        await this.cache.set('characters', this.characters);
        await this.syncQueue.add('delete', 'ExtendedCharacter', { id }, id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to delete character:', error);
      }
    }
  }

  // --- Assets ---

  async getAssets(): Promise<Asset[]> {
    const cached = await this.cache.get<Asset[]>('assets');
    if (cached) return cached;

    await delay(200);
    const result = [...this.assets];

    if (this.config.enabled) {
      await this.cache.set('assets', result);
    }

    return result;
  }

  async saveAsset(asset: Asset): Promise<void> {
    await delay(200);
    const index = this.assets.findIndex(a => a.id === asset.id);
    if (index >= 0) {
      this.assets[index] = asset;
    } else {
      this.assets.push(asset);
    }

    if (this.config.enabled) {
      try {
        await this.cache.set(`asset_${asset.id}`, asset);
        await this.cache.set('assets', this.assets);
        await this.syncQueue.add('save', 'Asset', asset, asset.id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to save asset:', error);
      }
    }
  }

  async deleteAsset(id: string): Promise<void> {
    await delay(100);
    this.assets = this.assets.filter(a => a.id !== id);

    if (this.config.enabled) {
      try {
        await this.cache.remove(`asset_${id}`);
        await this.cache.set('assets', this.assets);
        await this.syncQueue.add('delete', 'Asset', { id }, id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to delete asset:', error);
      }
    }
  }

  // --- Events ---

  async getEvents(): Promise<ScenarioEvent[]> {
    const cached = await this.cache.get<ScenarioEvent[]>('events');
    if (cached) return cached;

    await delay(200);
    const result = [...this.events];

    if (this.config.enabled) {
      await this.cache.set('events', result);
    }

    return result;
  }

  async saveEvent(event: ScenarioEvent): Promise<void> {
    await delay(100);
    const index = this.events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      this.events[index] = event;
    } else {
      this.events.push(event);
    }

    if (this.config.enabled) {
      try {
        await this.cache.set(`event_${event.id}`, event);
        await this.cache.set('events', this.events);
        await this.syncQueue.add('save', 'ScenarioEvent', event, event.id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to save event:', error);
      }
    }
  }

  async deleteEvent(id: string): Promise<void> {
    await delay(100);
    this.events = this.events.filter(e => e.id !== id);

    if (this.config.enabled) {
      try {
        await this.cache.remove(`event_${id}`);
        await this.cache.set('events', this.events);
        await this.syncQueue.add('delete', 'ScenarioEvent', { id }, id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to delete event:', error);
      }
    }
  }

  // --- Files ---

  async getFiles(): Promise<FileItem[]> {
    const cached = await this.cache.get<FileItem[]>('files');
    if (cached) return cached;

    await delay(200);
    const result = [...this.files];

    if (this.config.enabled) {
      await this.cache.set('files', result);
    }

    return result;
  }

  async saveFile(file: FileItem): Promise<void> {
    await delay(100);
    const index = this.files.findIndex(f => f.id === file.id);
    if (index >= 0) {
      this.files[index] = file;
    } else {
      this.files.push(file);
    }

    if (this.config.enabled) {
      try {
        await this.cache.set(`file_${file.id}`, file);
        await this.cache.set('files', this.files);
        await this.syncQueue.add('save', 'FileItem', file, file.id);
      } catch (error) {
        console.warn('[PersistentMockDatabase] Failed to save file:', error);
      }
    }
  }

  // --- Storage Management ---

  private async loadCharacters(): Promise<ExtendedCharacter[] | null> {
    return this.persistence.get<ExtendedCharacter[]>('characters');
  }

  private async loadAssets(): Promise<Asset[] | null> {
    return this.persistence.get<Asset[]>('assets');
  }

  private async loadEvents(): Promise<ScenarioEvent[] | null> {
    return this.persistence.get<ScenarioEvent[]>('events');
  }

  private async loadFiles(): Promise<FileItem[] | null> {
    return this.persistence.get<FileItem[]>('files');
  }

  private async loadChapters(): Promise<Chapter[] | null> {
    return this.persistence.get<Chapter[]>('chapters');
  }

  private async loadNodesMap(): Promise<Record<string, SceneNode[]> | null> {
    return this.persistence.get<Record<string, SceneNode[]>>('nodesMap');
  }

  private async saveCharactersToStorage(): Promise<void> {
    await this.persistence.set('characters', this.characters);
  }

  private async saveAssetsToStorage(): Promise<void> {
    await this.persistence.set('assets', this.assets);
  }

  private async saveEventsToStorage(): Promise<void> {
    await this.persistence.set('events', this.events);
  }

  private async saveFilesToStorage(): Promise<void> {
    await this.persistence.set('files', this.files);
  }

  private async saveChaptersToStorage(): Promise<void> {
    await this.persistence.set('chapters', this.chapters);
  }

  private async saveNodesMapToStorage(): Promise<void> {
    await this.persistence.set('nodesMap', this.nodesMap);
  }

  // --- Utility Methods ---

  async exportData(): Promise<any> {
    return {
      characters: this.characters,
      assets: this.assets,
      events: this.events,
      files: this.files,
      chapters: this.chapters,
      nodesMap: this.nodesMap,
      exportedAt: new Date().toISOString(),
    };
  }

  async importData(data: any): Promise<void> {
    if (data.characters) this.characters = data.characters;
    if (data.assets) this.assets = data.assets;
    if (data.events) this.events = data.events;
    if (data.files) this.files = data.files;
    if (data.chapters) this.chapters = data.chapters;
    if (data.nodesMap) this.nodesMap = data.nodesMap;

    if (this.config.enabled) {
      await this.saveAll();
    }
  }

  async clearStorage(): Promise<void> {
    await this.cache.clear();
    await this.syncQueue.clear();
  }

  getSyncQueueSize(): number {
    return this.syncQueue.getSize();
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }

  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<any> {
    await delay(200);
    return {
      totalWords: 45200,
      weeklyWordsAdded: 1200,
      assetCount: this.assets.length,
      compileCount: 'v0.4.2',
      completionPercentage: 65,
      recentChapters: this.chapters.slice(0, 5).map((ch, idx) => ({
        id: ch.id,
        title: ch.title,
        sceneId: `Scene ${idx + 1}`,
        status: idx === 0 ? 'Draft' : idx === 1 ? 'Final' : 'Review',
        edited: ['10 mins ago', 'Yesterday', '3 days ago', 'Last week', '2 weeks ago'][idx] || 'Old',
      })),
      recentAssets: this.assets.slice(0, 4),
    };
  }

  // --- Scratchpad ---
  async getScratchpadItems(): Promise<any[]> {
    await delay(100);
    return [
      { id: '1', text: 'Fix typo in Scene 2 dialogue', completed: true },
      { id: '2', text: 'Request sprite variation for Akira (Angry)', completed: false },
      { id: '3', text: 'Review sound effects for rain scene', completed: false },
    ];
  }

  async saveScratchpadItem(item: any): Promise<string> {
    await delay(100);
    return item.id;
  }

  async deleteScratchpadItem(id: string): Promise<void> {
    await delay(100);
  }
}
