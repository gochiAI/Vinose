
export interface CustomProperty {
  id: string;
  key: string;
  value: string;
}

export enum VariableType {
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  initialValue: number | boolean;
}

export enum VariableOperationAction {
  SET = 'SET',
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
}

export interface VariableOperation {
  variableId: string;
  action: VariableOperationAction;
  value: number | boolean;
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GTE = 'GTE',
  LTE = 'LTE',
}

export interface Condition {
  variableId: string;
  operator: ConditionOperator;
  value: number | boolean;
}

export interface Character {
  id:string;
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

export interface Group {
  id: string;
  title: string;
  color: string;
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
  BRANCH = 'BRANCH',
  GOTO_SCENE = 'GOTO_SCENE',
  SFX = 'SFX',
}

export interface DialogueEvent {
  id: string;
  type: EventType.DIALOGUE;
  characterId: string;
  text: string;
  spriteAssetId?: string;
  sfxAssetId?: string;
  postExecutionActions?: VariableOperation[];
}

export interface ActionEvent {
  id: string;
  type: EventType.ACTION;
  description: string;
  sfxAssetId?: string;
  postExecutionActions?: VariableOperation[];
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
  displayCondition?: Condition;
}

export enum BranchMode {
  PLAYER_CHOICE = 'PLAYER_CHOICE',
  AUTO_CONDITION = 'AUTO_CONDITION',
}

export interface ConditionalBranch {
  id: string;
  condition?: Condition;
  nextSceneId: string;
}

export interface BranchEvent {
  id: string;
  type: EventType.BRANCH;
  mode: BranchMode;
  choices?: Choice[];
  branches?: ConditionalBranch[];
}

export interface GoToSceneEvent {
    id: string;
    type: EventType.GOTO_SCENE;
    nextSceneId: string;
}

export interface SfxEvent {
  id: string;
  type: EventType.SFX;
  sfxAssetId: string;
}

export type SceneEvent = DialogueEvent | ActionEvent | BackgroundChangeEvent | BranchEvent | GoToSceneEvent | SfxEvent;

export interface Scene {
  id: string;
  title: string;
  events: SceneEvent[];
  plotId?: string;
  groupId?: string;
}

export interface ProjectData {
  projectName: string;
  characters: Character[];
  locations: Location[];
  items: Item[];
  memos: Memo[];
  tasks: Task[];
  plots: Plot[];
  groups: Group[];
  scenes: Scene[];
  relationships: Relationship[];
  assets: Asset[];
  variables: Variable[];
}

export type EditableItem =
  | { type: 'character'; data: Character }
  | { type: 'location'; data: Location }
  | { type: 'item'; data: Item }
  | { type: 'memo'; data: Memo }
  | { type: 'task'; data: Task }
  | { type: 'plot'; data: Plot }
  | { type: 'group'; data: Group }
  | { type: 'scene'; data: Scene }
  | { type: 'asset'; data: Asset }
  | { type: 'variable', data: Variable }
  | null;

export type DbItemType = 'character' | 'location' | 'item' | 'memo' | 'task' | 'asset' | 'plot' | 'variable' | 'group';

export type ShortcutAction =
  | 'NEW_SCENE'
  | 'NEW_CHARACTER'
  | 'CLOSE_SHEET'
  | 'FOCUS_SEARCH'
  | 'DELETE_NODE'
  | 'EDIT_NODE'
  | 'NAV_UP'
  | 'NAV_DOWN'
  | 'NAV_LEFT'
  | 'NAV_RIGHT'
  | 'PAN_VIEW_UP'
  | 'PAN_VIEW_DOWN'
  | 'PAN_VIEW_LEFT'
  | 'PAN_VIEW_RIGHT'
  | 'ZOOM_IN'
  | 'ZOOM_OUT';
