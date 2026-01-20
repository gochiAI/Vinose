import { SceneNode, ExtendedCharacter, Asset, ScenarioEvent, FileItem, Chapter, ProjectInfo } from '../../types';

export interface DatabaseAdapter {
  // Projects / Meta
  getProjectInfo(): Promise<ProjectInfo | null>;
  updateProjectInfo(name: string, description?: string): Promise<ProjectInfo>;
  
  // Scenes & Chapters
  getChapters(): Promise<Chapter[]>;
  getNodesForChapter(chapterId: string): Promise<SceneNode[]>;
  saveNode(node: SceneNode): Promise<void>;
  createNode(node: SceneNode): Promise<void>;
  saveChapter(chapter: Chapter): Promise<void>;
  
  // Characters
  getCharacters(): Promise<ExtendedCharacter[]>;
  saveCharacter(character: ExtendedCharacter): Promise<void>;
  deleteCharacter(id: string): Promise<void>;

  // Assets
  getAssets(): Promise<Asset[]>;
  saveAsset(asset: Asset): Promise<void>;
  deleteAsset(id: string): Promise<void>;

  // Events (Scenarios)
  getEvents(): Promise<ScenarioEvent[]>;
  saveEvent(event: ScenarioEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  // Documents
  getFiles(): Promise<FileItem[]>;
  saveFile(file: FileItem): Promise<void>;

  // Dashboard
  getDashboardStats(): Promise<any>;

  // Scratchpad
  getScratchpadItems(): Promise<any[]>;
  saveScratchpadItem(item: any): Promise<string>;
  deleteScratchpadItem(id: string): Promise<void>;
}