import { DatabaseAdapter } from "../db/types";
import {
  SceneNode,
  Episode,
  ExtendedCharacter,
  Asset,
  FileItem,
  Chapter,
  ProjectInfo,
} from "../../types";

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
    console.log("[SQLiteAdapter] baseUrl:", this.baseUrl);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
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
      console.error(
        `[SQLiteAdapter] Request failed: ${method} ${endpoint}`,
        error,
      );
      throw error;
    }
  }

  async getProjectInfo(): Promise<ProjectInfo | null> {
    try {
      return await this.request<ProjectInfo>("GET", "/api/project-info");
    } catch (error) {
      console.warn("[SQLiteAdapter] Failed to fetch project info:", error);
      return null;
    }
  }

  async updateProjectInfo(
    name: string,
    description?: string,
  ): Promise<ProjectInfo> {
    try {
      return await this.request<ProjectInfo>("PUT", "/api/project-info", {
        name,
        description,
      });
    } catch (error) {
      console.error("[SQLiteAdapter] Failed to update project info:", error);
      throw error;
    }
  }

  // --- Chapters & Nodes ---
  async getChapters(): Promise<Chapter[]> {
    try {
      return await this.request<Chapter[]>("GET", "/api/chapters");
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch chapters, returning empty:",
        error,
      );
      return [];
    }
  }
  async getChapter(id: string): Promise<Chapter | null> {
    try {
      return await this.request<Chapter>("GET", `/api/chapters/${id}`);
    } catch (error) {
      console.warn("[SQLiteAdapter] Failed to fetch chapter:", error);
      return null;
    }
  }

  async saveChapter(chapter: Chapter): Promise<void> {
    await this.request("POST", "/api/chapters", chapter);
  }

  async deleteChapter(id: string): Promise<void> {
    await this.request("DELETE", `/api/chapters/${id}`);
  }

  async getEpisodes(chapterId: string): Promise<Episode[]> {
    try {
      return await this.request<Episode[]>("GET", `/api/episodes/${chapterId}`);
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch episodes, returning empty:",
        error,
      );
      return [];
    }
  }

  async createEpisode(episode: Episode): Promise<string> {
    const response = await this.request<{ id: string }>(
      "POST",
      `/api/episodes/${episode.id}`,
      episode,
    );
    return response.id;
  }

  async saveEpisode(episode: Episode): Promise<void> {
    await this.request("POST", `/api/episodes/${episode.id}`, episode);
  }

  async deleteEpisode(id: string): Promise<void> {
    await this.request("DELETE", `/api/episodes/${id}`);
  }

  async getSceneNodes(episodeId?: string): Promise<SceneNode[]> {
    const endpoint = episodeId
      ? `/api/episodes/${episodeId}`
      : "/api/scenenodes";
    try {
      return await this.request<SceneNode[]>("GET", endpoint);
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch scene nodes, returning empty:",
        error,
      );
      return [];
    }
  }

  async saveSceneNode(node: SceneNode): Promise<void> {
    await this.request("POST", "/api/scenenodes", node);
  }

  async getNodesForChapter(
    chapterId: string,
    episodeId?: string,
  ): Promise<SceneNode[]> {
    try {
      // If episodeId exists, use the specific endpoint, otherwise use the chapter endpoint
      const endpoint = episodeId
        ? `/api/scenenodes/chapter/${chapterId}/${episodeId}`
        : `/api/scenenodes/chapter/${chapterId}`;

      return await this.request<SceneNode[]>("GET", endpoint);
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch scene nodes for chapter/episode, returning empty:",
        error,
      );
      return [];
    }
  }

  async deleteSceneNode(id: string): Promise<void> {
    await this.request("DELETE", `/api/scenenodes/${id}`);
  }

  // --- Characters ---
  async getCharacters(): Promise<ExtendedCharacter[]> {
    try {
      return await this.request<ExtendedCharacter[]>("GET", "/api/characters");
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch characters, returning empty:",
        error,
      );
      return [];
    }
  }

  async saveCharacter(character: ExtendedCharacter): Promise<void> {
    await this.request("POST", "/api/characters", character);
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.request("DELETE", `/api/characters/${id}`);
  }

  // --- Assets ---
  async getAssets(): Promise<Asset[]> {
    try {
      return await this.request<Asset[]>("GET", "/api/assets");
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch assets, returning empty:",
        error,
      );
      return [];
    }
  }

  async saveAsset(asset: Asset): Promise<void> {
    await this.request("POST", "/api/assets", asset);
  }

  async deleteAsset(id: string): Promise<void> {
    await this.request("DELETE", `/api/assets/${id}`);
  }

  // --- Files ---
  async getFiles(): Promise<FileItem[]> {
    try {
      return await this.request<FileItem[]>("GET", "/api/files");
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch files, returning empty:",
        error,
      );
      return [];
    }
  }

  async saveFile(file: FileItem): Promise<void> {
    await this.request("POST", "/api/files", file);
  }
  async deleteFile(id: string): Promise<void> {
    await this.request("DELETE", `/api/files/${id}`);
  }

  // --- Dashboard ---
  async getDashboardStats(): Promise<any> {
    try {
      return await this.request("GET", "/api/dashboard/stats");
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch dashboard stats, returning defaults:",
        error,
      );
      return {
        totalWords: 0,
        assetCount: 0,
        compileCount: "v0",
        completionPercentage: 0,
        recentChapters: [],
        recentAssets: [],
      };
    }
  }

  // --- Scratchpad ---
  async getScratchpadItems(): Promise<any[]> {
    try {
      return await this.request<any[]>("GET", "/api/scratchpad");
    } catch (error) {
      console.warn(
        "[SQLiteAdapter] Failed to fetch scratchpad items, returning empty:",
        error,
      );
      return [];
    }
  }

  async saveScratchpadItem(item: any): Promise<string> {
    await this.request("PUT", `/api/scratchpad/${item.id}`, item);
    return item.id;
  }

  async deleteScratchpadItem(id: string): Promise<void> {
    await this.request("DELETE", `/api/scratchpad/${id}`);
  }
}
