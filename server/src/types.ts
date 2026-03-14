export interface Settings {
  theme: "light" | "dark" | "system";
  language: string;
  autosave: boolean;
  fontsize: number;
}
export interface Project {
  id: string;
  name: string;
  creators: string[];
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}
export interface HeaderInfo {
  title: string;
  chapter: string;
  episode?: string;
  scene: string;
}
/**ダッシュボード */
export interface DashboardStats {
  totalwords: number;
  assetfiles: number;
  characters: number;
  version: string;
  completionPercentage: number;
}
export interface RecentEpisodes {
  id: string;
  title: string;
  chapterTitle: string;
  updatedAt: string;
}
export interface RecentAssets {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
}
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}
/**ドキュメント */
interface BaseItem {
  id: string;
  name: string;
  parentId?: string;
  updatedAt: string;
}

export interface Folder extends BaseItem {
  type: "folder";
}

export interface Document extends BaseItem {
  type: "doc";
  content: string;
}

export type CellType = "text" | "number" | "checkbox" | "date";

export interface CellMeta {
  type: CellType;
  format?: string;
}

export interface SheetData {
  values: string[][];
  metadata: Record<string, CellMeta>;
}
export interface Sheet extends BaseItem {
  type: "sheet";
  data: SheetData;
}
export type FileItem = Folder | Document | Sheet;

/**
 * チャプター・エピソード・シーン
 */
export type PublishStatus = "draft" | "published" | "archived";
interface EntityBase {
  id: string;
  title: string;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}
export interface Chapter extends EntityBase {
  episodeCount: number;
  sceneCount: number;
}
export interface Episode extends EntityBase {
  chapterId: string;
  episodeNumber: number;
  orderIndex: number;
  description: string;
  characters: string[];
  timeframe?: string;
}

export interface SceneNode extends Omit<EntityBase, "status"> {
  type: "start" | "scene" | "end";
  chapterId: string;
  episodeId: string;
  summary?: string;
  script?: Block[];    // セリフやト書きの配列
  nextIds: string[];   // 次のシーンへのポインタ
}

export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  outfit?: string;
}

export interface ExtendedCharacter extends Character {
  role: string;
  age: string;
  height: string;
  coverUrl: string;
  description: string;
  relationships: {
    targetId: string;
    type: "friend" | "enemy" | "rival" | "love" | string;
    desc: string;
  }[];
  notes: string[];
  tags: string[];
}

export interface NarrateContent {
  text: string;
}
export interface DialogueContent {
  characterId: string;
  text: string;
}

export interface BranchOption {
  type: "user" | "condition";
  text: string;
  target: string;
}
export interface ChoiceContent {
  options: BranchOption[];
}

export type MediaCategory = "background" | "bgm" | "se" | "sprite";

export interface MediaContent {
  assetId: string;
  category: MediaCategory;
  // 演出用のオプション（任意）
  volume?: number;     // BGM/SE用 (0.0 ~ 1.0)
  loop?: boolean;      // BGM用
  fadeDuration?: number; // フェードイン・アウトの時間（ms）
  position?: "center" | "left" | "right"; // キャラ絵などの立ち位置
}

export interface NarrateBlock {
  id: string;
  type: "narrate";
  content: NarrateContent;
}
export interface DialogueBlock {
  id: string;
  type: "dialogue";
  content: DialogueContent;
}

export interface ChoiceBlock {
  id: string;
  type: "choice";
  content: ChoiceContent;
}

export interface MediaBlock {
  id: string;
  type: "media";
  content: MediaContent;
}

export interface MoveBlock {
  id: string;
  type: "move";
  content: {
    targetNodeId: string;
  };
}

export type Block = NarrateBlock | DialogueBlock | ChoiceBlock | MediaBlock| MoveBlock;

export interface BaseAsset {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}
interface ImageAsset {
  type: "image";
  subtype: "bg" | "cg" | "sprite";
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

interface AudioAsset {
  type: "audio";
  subtype: "bgm" | "se" | "voice";
  metadata?: {
    duration: number; // in seconds
    format: string;
  };
}

export type Asset = BaseAsset & (ImageAsset | AudioAsset);
