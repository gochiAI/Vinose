
export interface SceneNode {
  id: string;
  title: string;
  type: 'start' | 'choice' | 'scene' | 'end';
  chapterId?: string;
  summary?: string;
  script?: string;
  background?: string; // Currently active background
  backgrounds?: string[]; // List of available backgrounds for this scene
  bgm?: string;
  sfx?: string[];
  flags?: string[]; // Logic flags for game state
  // Connections are now explicit data, coordinates are calculated
  nextIds?: string[];
  updatedAt?: string; // Last update timestamp
}

export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  outfit?: string;
}

export interface ExtendedCharacter {
  id: string;
  name: string;
  role: string;
  age: string;
  height: string;
  avatarUrl: string;
  coverUrl: string;
  description: string;
  relationships: { target: string; type: string; desc: string }[];
  notes: string[];
  tags: string[];
}

export interface ScriptLine {
  id: string;
  type: 'dialogue' | 'action' | 'header' | 'sfx';
  character?: string;
  text: string;
  meta?: string;
}

export type BlockType = 'dialogue' | 'narrate' | 'media' | 'choice' | 'transition';

export interface Block {
  id: string;
  type: BlockType;
  content: any;
}

export interface Scenario {
  id: string;
  title: string;
  sceneId: string;
  status: 'Draft' | 'Final' | 'Review';
  edited: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface HeaderInfo {
  title: string;
  chapter: string;
  scene: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'audio';
  subtype: 'bg' | 'cg' | 'sprite' | 'bgm' | 'se' | 'voice' | 'other';
  url: string;
  size: string;
  date: string;
}

export interface ScenarioEvent {
  id: string;
  timing: string;      // 時期
  eventName: string;   // イベント名
  details: string;     // 内容詳細
  characters: string[]; // 登場人物 (Names or IDs)
  visuals: {           // スチル/背景
    type: 'bg' | 'cg';
    name: string;
    url?: string;
  };
  notes?: string;      // 備考など
  status: 'Draft' | 'Final' | 'Review';
}

// New Types for Document Management
export type FileType = 'folder' | 'doc' | 'sheet';

export interface FileItem {
  id: string;
  parentId: string | null; // null represents Root
  name: string;
  type: FileType;
  updatedAt: string;
  url?: string; // External link for docs/sheets (Legacy support)
  content?: any; // Stores the actual document text or sheet data
  owner?: string;
}

export interface Chapter {
  id: string; // UUID
  title: string;
  sceneCount: number;
  lastEdited: string;
  status: 'Draft' | 'Review' | 'Final';
}