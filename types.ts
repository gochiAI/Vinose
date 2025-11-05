
export interface CustomProperty {
  id: string;
  key: string;
  value: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  properties?: CustomProperty[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  properties?: CustomProperty[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  properties?: CustomProperty[];
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  properties?: CustomProperty[];
}

export interface Plot {
  id: string;
  title: string;
  content: string;
  properties?: CustomProperty[];
}

export interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
}

export interface Relationship {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  type: string;
}

export enum AssetType {
    BACKGROUND = 'BACKGROUND',
    SPRITE = 'SPRITE',
    SFX = 'SFX',
}

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    data: string; // base64 data URL
    mimeType: string;
}

export enum EventType {
  DIALOGUE = 'DIALOGUE',
  ACTION = 'ACTION',
  BACKGROUND_CHANGE = 'BACKGROUND_CHANGE',
  CHOICE = 'CHOICE',
  GOTO_SCENE = 'GOTO_SCENE',
}

export interface DialogueEvent {
  id: string;
  type: EventType.DIALOGUE;
  characterId: string;
  text: string;
  spriteAssetId?: string;
  sfxAssetId?: string;
}

export interface ActionEvent {
  id: string;
  type: EventType.ACTION;
  description: string;
  sfxAssetId?: string;
}

export interface BackgroundChangeEvent {
  id: string;
  type: EventType.BACKGROUND_CHANGE;
  backgroundAssetId: string;
}

export interface Choice {
  id: string;
  text: string;
  nextSceneId: string;
}

export interface ChoiceEvent {
  id:string;
  type: EventType.CHOICE;
  choices: Choice[];
}

export interface GoToSceneEvent {
    id: string;
    type: EventType.GOTO_SCENE;
    nextSceneId: string;
}

export type SceneEvent = DialogueEvent | ActionEvent | BackgroundChangeEvent | ChoiceEvent | GoToSceneEvent;

export interface Scene {
  id: string;
  title: string;
  events: SceneEvent[];
}

export interface ProjectData {
  projectName: string;
  characters: Character[];
  locations: Location[];
  items: Item[];
  memos: Memo[];
  tasks: Task[];
  plots: Plot[];
  scenes: Scene[];
  relationships: Relationship[];
  assets: Asset[];
}

export type EditableItem =
  | { type: 'character'; data: Character }
  | { type: 'location'; data: Location }
  | { type: 'item'; data: Item }
  | { type: 'memo'; data: Memo }
  | { type: 'task'; data: Task }
  | { type: 'plot'; data: Plot }
  | { type: 'scene'; data: Scene }
  | { type: 'asset'; data: Asset }
  | null;

export type DbItemType = 'character' | 'location' | 'item' | 'memo' | 'task' | 'asset' | 'plot';