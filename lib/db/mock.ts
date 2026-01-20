import { DatabaseAdapter } from './types';
import { SceneNode, ExtendedCharacter, Asset, ScenarioEvent, FileItem, Chapter, ProjectInfo } from '../../types';
import { 
  mockChapters, 
  chapter1Nodes, 
  chaptersMap, 
  initialCharacters, 
  initialAssets, 
  initialEvents, 
  initialFiles 
} from '../../data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDatabase implements DatabaseAdapter {
    async saveChapter(chapter: Chapter): Promise<void> {
      await delay(100);
      const index = this.chapters.findIndex(c => c.id === chapter.id);
      if (index >= 0) {
        this.chapters[index] = chapter;
      } else {
        this.chapters.push(chapter);
      }
    }
  private characters: ExtendedCharacter[] = [...initialCharacters];
  private assets: Asset[] = [...initialAssets];
  private events: ScenarioEvent[] = [...initialEvents];
  private files: FileItem[] = [...initialFiles];
  private chapters: Chapter[] = [...mockChapters];
  private nodesMap: Record<string, SceneNode[]> = this.initializeNodesMap();

  private initializeNodesMap(): Record<string, SceneNode[]> {
    const map: Record<string, SceneNode[]> = {};
    for (const [chapterTitle, nodes] of Object.entries(chaptersMap)) {
      // Deep copy each node to avoid shared references
      map[chapterTitle] = nodes.map(node => ({ ...node }));
    }
    return map;
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
    await delay(300); // Simulate fetching nodes
    return this.nodesMap[chapterTitle] || [];
  }

  async saveNode(node: SceneNode): Promise<void> {
    await delay(100);
    // Find and update the node in the appropriate chapter
    const chapterTitle = node.chapterId || this.findChapterByNodeId(node.id);
    if (chapterTitle && this.nodesMap[chapterTitle]) {
      const index = this.nodesMap[chapterTitle].findIndex(n => n.id === node.id);
      if (index >= 0) {
        this.nodesMap[chapterTitle][index] = { ...node };
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

  async createNode(node: SceneNode): Promise<void> {
    await delay(100);
    // Find the chapter by chapterId or title
    const chapterTitle = node.chapterId || Object.keys(this.nodesMap)[0];
    if (!this.nodesMap[chapterTitle]) {
      this.nodesMap[chapterTitle] = [];
    }
    // Ensure we don't add duplicates
    if (!this.nodesMap[chapterTitle].find(n => n.id === node.id)) {
      this.nodesMap[chapterTitle].push({ ...node });
    }
  }

  // --- Characters ---
  async getCharacters(): Promise<ExtendedCharacter[]> {
    await delay(200);
    return [...this.characters];
  }

  async saveCharacter(character: ExtendedCharacter): Promise<void> {
    await delay(200);
    const index = this.characters.findIndex(c => c.id === character.id);
    if (index >= 0) {
      this.characters[index] = character;
    } else {
      this.characters.push(character);
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    await delay(100);
    this.characters = this.characters.filter(c => c.id !== id);
  }

  // --- Assets ---
  async getAssets(): Promise<Asset[]> {
    await delay(200);
    return [...this.assets];
  }

  async saveAsset(asset: Asset): Promise<void> {
    await delay(200);
    const index = this.assets.findIndex(a => a.id === asset.id);
    if (index >= 0) {
      this.assets[index] = asset;
    } else {
      this.assets.push(asset);
    }
  }

  async deleteAsset(id: string): Promise<void> {
    await delay(100);
    this.assets = this.assets.filter(a => a.id !== id);
  }

  // --- Events ---
  async getEvents(): Promise<ScenarioEvent[]> {
    await delay(200);
    return [...this.events];
  }

  async saveEvent(event: ScenarioEvent): Promise<void> {
    await delay(100);
    const index = this.events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      this.events[index] = event;
    } else {
      this.events.push(event);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    await delay(100);
    this.events = this.events.filter(e => e.id !== id);
  }

  // --- Files ---
  async getFiles(): Promise<FileItem[]> {
    await delay(200);
    return [...this.files];
  }

  async saveFile(file: FileItem): Promise<void> {
    await delay(100);
    const index = this.files.findIndex(f => f.id === file.id);
    if (index >= 0) {
      this.files[index] = file;
    } else {
      this.files.push(file);
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