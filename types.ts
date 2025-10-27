
export interface Character {
  id: string;
  name: string;
  description: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
}

export interface Relationship {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  type: string;
}

export enum EventType {
  DIALOGUE = 'DIALOGUE',
  ACTION = 'ACTION',
  BACKGROUND_CHANGE = 'BACKGROUND_CHANGE',
  CHOICE = 'CHOICE',
}

export interface DialogueEvent {
  id: string;
  type: EventType.DIALOGUE;
  characterId: string;
  text: string;
}

export interface ActionEvent {
  id: string;
  type: EventType.ACTION;
  description: string;
}

export interface BackgroundChangeEvent {
  id: string;
  type: EventType.BACKGROUND_CHANGE;
  locationId: string;
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

export type SceneEvent = DialogueEvent | ActionEvent | BackgroundChangeEvent | ChoiceEvent;

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
  scenes: Scene[];
  relationships: Relationship[];
}

export type EditableItem =
  | { type: 'character'; data: Character }
  | { type: 'location'; data: Location }
  | { type: 'item'; data: Item }
  | { type: 'scene'; data: Scene }
  | null;

export type DbItemType = 'character' | 'location' | 'item';