import { DatabaseAdapter } from '../db/types';
import { SceneNode, ExtendedCharacter, Asset, ScenarioEvent, FileItem, Chapter, ProjectInfo } from '../../types';

export interface SQLiteAdapterConfig {
  baseUrl: string;
  timeout?: number;
}

export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private baseUrl: string;
  private timeout: number;

  constructor(config: SQLiteAdapterConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    console.log('[SQLiteAdapter] baseUrl:', this.baseUrl);
  }

  private async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[SQLiteAdapter] Request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  async getProjectInfo(): Promise<ProjectInfo | null> {
    try {
      return await this.request<ProjectInfo>('GET', '/api/project-info');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch project info:', error);
      return null;
    }
  }

  async updateProjectInfo(name: string, description?: string): Promise<ProjectInfo> {
    try {
      return await this.request<ProjectInfo>('PUT', '/api/project-info', { name, description });
    } catch (error) {
      console.error('[SQLiteAdapter] Failed to update project info:', error);
      throw error;
    }
  }

  // --- Chapters & Nodes ---
  async getChapters(): Promise<Chapter[]> {
    try {
      return await this.request<Chapter[]>('GET', '/api/chapters');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch chapters, returning empty:', error);
      return [];
    }
  }

  async getNodesForChapter(chapterId: string): Promise<SceneNode[]> {
    try {
      return await this.request<SceneNode[]>('GET', `/api/scene-nodes/chapter/${chapterId}`);
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch nodes, returning empty:', error);
      return [];
    }
  }

  async saveNode(node: SceneNode): Promise<void> {
    await this.request('PUT', `/api/scene-nodes/${node.id}`, node);
  }

  async createNode(node: SceneNode): Promise<void> {
    await this.request('POST', '/api/scene-nodes', node);
  }

  async saveChapter(chapter: Chapter): Promise<void> {
    await this.request('POST', '/api/chapters', chapter);
  }

  // --- Characters ---
  async getCharacters(): Promise<ExtendedCharacter[]> {
    try {
      return await this.request<ExtendedCharacter[]>('GET', '/api/characters');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch characters, returning empty:', error);
      return [];
    }
  }

  async saveCharacter(character: ExtendedCharacter): Promise<void> {
    await this.request('POST', '/api/characters', character);
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.request('DELETE', `/api/characters/${id}`);
  }

  // --- Assets ---
  async getAssets(): Promise<Asset[]> {
    try {
      return await this.request<Asset[]>('GET', '/api/assets');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch assets, returning empty:', error);
      return [];
    }
  }

  async saveAsset(asset: Asset): Promise<void> {
    await this.request('POST', '/api/assets', asset);
  }

  async deleteAsset(id: string): Promise<void> {
    await this.request('DELETE', `/api/assets/${id}`);
  }

  // --- Events ---
  async getEvents(): Promise<ScenarioEvent[]> {
    try {
      return await this.request<ScenarioEvent[]>('GET', '/api/events');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch events, returning empty:', error);
      return [];
    }
  }

  async saveEvent(event: ScenarioEvent): Promise<void> {
    await this.request('PUT', `/api/events/${event.id}`, event);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.request('DELETE', `/api/events/${id}`);
  }

  // --- Files ---
  async getFiles(): Promise<FileItem[]> {
    try {
      return await this.request<FileItem[]>('GET', '/api/files');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch files, returning empty:', error);
      return [];
    }
  }

  async saveFile(file: FileItem): Promise<void> {
    await this.request('POST', '/api/files', file);
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<any> {
    try {
      return await this.request('GET', '/api/dashboard/stats');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch dashboard stats, returning defaults:', error);
      return {
        totalWords: 0,
        assetCount: 0,
        compileCount: 'v0',
        completionPercentage: 0,
        recentChapters: [],
        recentAssets: [],
      };
    }
  }

  // --- Scratchpad ---
  async getScratchpadItems(): Promise<any[]> {
    try {
      return await this.request<any[]>('GET', '/api/scratchpad');
    } catch (error) {
      console.warn('[SQLiteAdapter] Failed to fetch scratchpad items, returning empty:', error);
      return [];
    }
  }

  async saveScratchpadItem(item: any): Promise<string> {
    await this.request('PUT', `/api/scratchpad/${item.id}`, item);
    return item.id;
  }

  async deleteScratchpadItem(id: string): Promise<void> {
    await this.request('DELETE', `/api/scratchpad/${id}`);
  }
}
