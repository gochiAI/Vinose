import { SceneNode,Episode,ExtendedCharacter, Asset, FileItem, Chapter, ProjectInfo } from '../../types';

export interface DatabaseAdapter {
  // Projects / Meta
  getProjectInfo(): Promise<ProjectInfo | null>;
  updateProjectInfo(name: string, description?: string): Promise<ProjectInfo>;
  
  // Chapters / Episodes / Nodes
  getChapters(): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  saveChapter(chapter: Chapter): Promise<void>;
  deleteChapter(id: string): Promise<void>;
  
  getEpisodes(chapterId: string): Promise<Episode[]>;
  createEpisode(episode: Episode): Promise<string>;
  saveEpisode(episode: Episode): Promise<void>;
  updateEpisode(id: string, episode: Episode): Promise<void>;
  deleteEpisode(id: string): Promise<void>;

  getSceneNodes(episodeId?: string): Promise<SceneNode[]>;
  getNodesForChapter(chapterId: string): Promise<SceneNode[]>;
  saveSceneNode(node: SceneNode): Promise<void>;
  deleteSceneNode(id: string): Promise<void>;
  
  // Characters
  getCharacters(): Promise<ExtendedCharacter[]>;
  saveCharacter(character: ExtendedCharacter): Promise<void>;
  deleteCharacter(id: string): Promise<void>;

  // Assets
  getAssets(): Promise<Asset[]>;
  saveAsset(asset: Asset): Promise<void>;
  deleteAsset(id: string): Promise<void>;

  // Documents
  getFiles(): Promise<FileItem[]>;
  saveFile(file: FileItem): Promise<void>;
  deleteFile(id: string): Promise<void>;
  // Dashboard
  getDashboardStats(): Promise<any>;

  // Scratchpad
  getScratchpadItems(): Promise<any[]>;
  saveScratchpadItem(item: any): Promise<string>;
  deleteScratchpadItem(id: string): Promise<void>;
}