
import { Asset, Scenario, ScenarioEvent, SceneNode, Chapter, FileItem, ExtendedCharacter } from './types';

// --- Characters ---

export const initialCharacters: ExtendedCharacter[] = [
  {
    id: '1',
    name: 'Alice',
    role: 'Protagonist',
    age: '17',
    height: '162cm',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiKVps8K-fLaXN7zTwe0yYQCQAf-CFlRRIrULgC2Sh8U0KVL6VO0O6HQEPYVFmsnv21LtfL0KrJ55mEVhC2KzaU6ub-_7gDoO7aTKUd5NVA7jTHZgbav5X7xk92cPIB5JS1kkSA0L5RC48bncLKO3qd6XJTuPB-uvQ4eZqSisH1qSEZVG4k5hDbhLuchh9wCdIL_hq2HA-06lBRw8u-mi6GY4kIzUIXuRBv8Z1nm-3rj4Zv2VTY0eehg6kQ6F9A-dRT6dTf3_sFk7u',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvCVhVacAeVfNFw1M78CrYEz9cB1nutMJljQAFyRitZ-at7OVRh1ZdZGgh6dh0fhslu4vrgF83S__P0qr56tde1cm5G4K-0d0WT77DWT7N0HVQEFLybP3VlNWlAbistbM7xdL9RqPB0tqGvP0fKYNXUoTv63mEUKSyr64yy3mZWg6H4Ovhz1gApbFOrYsqOr9r3er7D2ivhVfpCwnZvKW981r6TuSWGIna4XAtPLZ9nOUrkgo99P3rmH7ANa8TO-9SnI38M8877uoA',
    description: 'A curious student at the academy who stumbles upon the ancient mysteries of the library. She is determined, slightly reckless, and deeply cares for her friends.',
    relationships: [
      { target: 'Unknown', type: 'Rival/Mentor', desc: 'Mysterious encounters in the library.' },
      { target: 'Kael', type: 'Childhood Friend', desc: 'Trusts him implicitly.' }
    ],
    notes: ['Design concept: School uniform with a slight magical modification.', 'Voice actor needs to sound energetic but capable of serious tones.'],
    tags: ['Student', 'Magic User', 'Key Holder']
  },
  {
    id: '2',
    name: 'Unknown',
    role: 'Antagonist?',
    age: '??',
    height: '185cm',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBrxd_xIAxCHkYj_9FmKzP1k0LQSVx3awlFp_xtuXxFqH7S_TSpgR9KDvZV1lUH0OnrW9g6ZRKcTbGrmSVEk_5AzejDctGw49qucbQIuRUmmp_M5cOiC01-Y3nk3MnyddbEfHVEKhPWN018e9DggX4_icQvvIfqxU8N-jTIH8HQMKVMBQKUz0gFH6s_X7li_fBlxF210uMCsC46nptHx-S8q-apvF59bMST3YJKKkLwg5eyb3TXD5zwBdhIPnEQAyHSQTU0nGNkU7n',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvENCYZqQhgB8vUE4u-Doki29UHT_-3XPwU7AKYDzC2ojOsrDBkBPW_Z-t_mt4v230nqdszcwXNG-mLVIOMPpprq3sJHh2nJKi9GxaQ9sEl2pluNgSAKns7RgmfWuJXMK4Uoh2bqex03DoSFUXAZbxdu5FiPrDIyLMG2L_7avH-0Fy0H489H_tJBPwzyb_AtfqnQc7kyuJp97T2H2MYyGykwWNZu1YXK6IxSumDEZOtgjcFiFeJDRzgyQ_0d26p1e37wDsoN3LKinX',
    description: 'A shadowy figure often seen in the restricted sections. His motives are unclear, but he seems to know more about Alice than she knows about herself.',
    relationships: [
      { target: 'Alice', type: 'Observer', desc: 'Watches her progress closely.' }
    ],
    notes: ['Never show his face fully in the first 3 chapters.', 'Theme music should be low cello.'],
    tags: ['Mystery', 'Powerful', 'Cloaked']
  },
  {
    id: '3',
    name: 'Kael',
    role: 'Support',
    age: '18',
    height: '175cm',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlnbt92wzEsfzKwbIXZZCkL3scfzs5QU92flLLUnUO0jDjxT-UXEu31DNjoiaRGiIQp_-vefe4vwEGHOakkRra5xzC-k0nWuH5-f-4AAF6kaPNR6luttY4JxkrjbfK7pH5xDApfYzC0HgKgeQiF9mguyN4eOfTlQvyD-6escYq3zAtmQJAi5W0Gw-bqqu6nNHXEmFoaAgL0ZVvbeGRmOdC0TCLA12XRGbHehy_zLGIX93mZiOrY-bFyeICe-pg_JujgPONyY5NuAi8',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnj3ubDZwiGIvxXny3BlyTikpdTbQagXG2MIDIU8mX-HY59gFZaNtz2TtCyICxGWGVrX6kAWrx5VSJEv664AlHIj_G0ZCMPG2RNFT658ayoqVQOCktL6fuze_37Dt2lWTJnR_zEXXU3Idwof4CLGqLwD1fS094AH7812vKPAC4hS7c_OmTTOUt8z2pdmKo42c7zjz7O25FbO15uTNReqkXnyY_jUgKw8HpBvPAiD6yKTg8mkXRzVkGtXFdQ6i0I-uoq36Y2W0TgnoU',
    description: 'Alice\'s childhood friend. He is bookish, careful, and often tries to keep Alice out of trouble, usually failing.',
    relationships: [
      { target: 'Alice', type: 'Friend', desc: 'Wants to protect her.' }
    ],
    notes: ['Glasses should reflect light when he is being serious.'],
    tags: ['Student', 'Tech', 'Smart']
  }
];

// --- Assets ---

export const initialAssets: Asset[] = [
  { id: '1', name: 'bg_school_dusk.jpg', type: 'image', subtype: 'bg', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnj3ubDZwiGIvxXny3BlyTikpdTbQagXG2MIDIU8mX-HY59gFZaNtz2TtCyICxGWGVrX6kAWrx5VSJEv664AlHIj_G0ZCMPG2RNFT658ayoqVQOCktL6fuze_37Dt2lWTJnR_zEXXU3Idwof4CLGqLwD1fS094AH7812vKPAC4hS7c_OmTTOUt8z2pdmKo42c7zjz7O25FbO15uTNReqkXnyY_jUgKw8HpBvPAiD6yKTg8mkXRzVkGtXFdQ6i0I-uoq36Y2W0TgnoU', size: '2.4 MB', date: '2023-10-24' },
  { id: '2', name: 'bg_library_night.jpg', type: 'image', subtype: 'bg', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvCVhVacAeVfNFw1M78CrYEz9cB1nutMJljQAFyRitZ-at7OVRh1ZdZGgh6dh0fhslu4vrgF83S__P0qr56tde1cm5G4K-0d0WT77DWT7N0HVQEFLybP3VlNWlAbistbM7xdL9RqPB0tqGvP0fKYNXUoTv63mEUKSyr64yy3mZWg6H4Ovhz1gApbFOrYsqOr9r3er7D2ivhVfpCwnZvKW981r6TuSWGIna4XAtPLZ9nOUrkgo99P3rmH7ANa8TO-9SnI38M8877uoA', size: '3.1 MB', date: '2023-10-22' },
  { id: '3', name: 'char_alice_uniform.png', type: 'image', subtype: 'sprite', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiKVps8K-fLaXN7zTwe0yYQCQAf-CFlRRIrULgC2Sh8U0KVL6VO0O6HQEPYVFmsnv21LtfL0KrJ55mEVhC2KzaU6ub-_7gDoO7aTKUd5NVA7jTHZgbav5X7xk92cPIB5JS1kkSA0L5RC48bncLKO3qd6XJTuPB-uvQ4eZqSisH1qSEZVG4k5hDbhLuchh9wCdIL_hq2HA-06lBRw8u-mi6GY4kIzUIXuRBv8Z1nm-3rj4Zv2VTY0eehg6kQ6F9A-dRT6dTf3_sFk7u', size: '1.2 MB', date: '2023-10-20' },
  { id: '4', name: 'bgm_mystery_theme.mp3', type: 'audio', subtype: 'bgm', url: '', size: '4.5 MB', date: '2023-10-18' },
  { id: '5', name: 'se_door_creak.wav', type: 'audio', subtype: 'se', url: '', size: '0.4 MB', date: '2023-10-15' },
  { id: '6', name: 'bg_beach_day.jpg', type: 'image', subtype: 'bg', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbDVv06DDRJGCbLfNLF0XBd86zBrTpwb2Z0OQwapJ_6OugeDUaub3pG5NJJhhhhTIVbTTyutMcJNT33qn1QLT4Uo6Wxc7y6MMZnXYpQm_LbgXF439uvl3_Y8US5UZccayNgE6OWdFOGf6PF-b1Y9zR8rGVwXw7mh2avpRDHhPcRoNWKhfz05zqjf9d9TebOC9XQsyClkbdxOhg7xqsTnQ7id1vMir8s6hoDyjcxAwlgs9DR8mYZfuqoGnP2HmCvH0FyautoCGnAI_l', size: '2.8 MB', date: '2023-10-10' },
  { id: '7', name: 'bgm_school_days.mp3', type: 'audio', subtype: 'bgm', url: '', size: '3.8 MB', date: '2023-10-05' },
];

// --- Scene Nodes ---

// Add chapterId to all nodes
const addChapterIdToNodes = (nodes: SceneNode[], chapterId: string): SceneNode[] => {
  return nodes.map(node => ({ ...node, chapterId }));
};

export const chapter1NodesRaw: SceneNode[] = [
  { 
    id: '1', 
    title: 'Intro', 
    type: 'start', 
    summary: 'Establishing shot of the academy gates.', 
    nextIds: ['2'],
    flags: ['Game_Started'],
    script: "INT. ACADEMY GATES - DAY\n\nThe wind rustles through the ancient cherry blossom trees.\n\n[GOTO: 2]" 
  },
  { 
    id: '2', 
    title: 'Investigation', 
    type: 'choice', 
    summary: 'Player chooses where to look first.', 
    nextIds: ['3', '4'],
    script: "Where should I look first?\n\n[CHOICE]\n1. The Old Library => 3\n2. The Dormitory => 4" 
  },
  { 
    id: '3', 
    title: 'Scene 4', 
    type: 'scene', 
    summary: 'The encounter in the Old Library.', 
    nextIds: [],
    flags: ['Library_Unlocked'],
    background: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvCVhVacAeVfNFw1M78CrYEz9cB1nutMJljQAFyRitZ-at7OVRh1ZdZGgh6dh0fhslu4vrgF83S__P0qr56tde1cm5G4K-0d0WT77DWT7N0HVQEFLybP3VlNWlAbistbM7xdL9RqPB0tqGvP0fKYNXUoTv63mEUKSyr64yy3mZWg6H4Ovhz1gApbFOrYsqOr9r3er7D2ivhVfpCwnZvKW981r6TuSWGIna4XAtPLZ9nOUrkgo99P3rmH7ANa8TO-9SnI38M8877uoA',
    backgrounds: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDvCVhVacAeVfNFw1M78CrYEz9cB1nutMJljQAFyRitZ-at7OVRh1ZdZGgh6dh0fhslu4vrgF83S__P0qr56tde1cm5G4K-0d0WT77DWT7N0HVQEFLybP3VlNWlAbistbM7xdL9RqPB0tqGvP0fKYNXUoTv63mEUKSyr64yy3mZWg6H4Ovhz1gApbFOrYsqOr9r3er7D2ivhVfpCwnZvKW981r6TuSWGIna4XAtPLZ9nOUrkgo99P3rmH7ANa8TO-9SnI38M8877uoA'],
    script: `(The heavy oak doors creak open, revealing rows of dusty tomes illuminated by moonlight.)

ALICE
I didn't think anyone else had a key to this place.

MYSTERIOUS FIGURE
Keys are merely suggestions, aren't they? For those who know how to ask politely.

[SFX: MYSTERY_THEME_03]

ALICE
Who are you? And why were you looking at the Forbidden Section?

MYSTERIOUS FIGURE
(Chuckles softly, turning away from the shelf)
Curiosity killed the cat, Alice. Or so they say.

ALICE
I'm not a cat. And I have questions.`
  },
  { 
    id: '4', 
    title: 'Dormitory', 
    type: 'scene', 
    summary: 'Quiet night in.', 
    nextIds: [],
    script: "INT. DORM ROOM - NIGHT\n\nIt was unusually quiet tonight." 
  },
];

export const chapter2NodesRaw: SceneNode[] = [
  {
    id: 'c2-1',
    title: 'Cafe Entrance',
    type: 'start',
    summary: 'Meeting Kael at the local cafe.',
    nextIds: ['c2-2'],
    script: "INT. CAFE - DAY\n\nThe bell chimes as Alice enters.\n\nALICE\nSorry I'm late!"
  },
  {
    id: 'c2-2',
    title: 'Order Coffee',
    type: 'choice',
    summary: 'Choosing a drink.',
    nextIds: ['c2-3', 'c2-4'],
    script: "WAITER\nWhat can I get for you?\n\n[CHOICE]\n1. Iced Latte => c2-3\n2. Black Tea => c2-4"
  },
  {
    id: 'c2-3',
    title: 'Iced Latte',
    type: 'scene',
    summary: 'Sweet choice.',
    nextIds: [],
    script: "ALICE\nI'll have an iced latte, please."
  },
  {
    id: 'c2-4',
    title: 'Black Tea',
    type: 'scene',
    summary: 'Classic choice.',
    nextIds: [],
    script: "ALICE\nEarl Grey, hot."
  }
];

export const chapter3NodesRaw: SceneNode[] = [
  {
    id: 'c3-1',
    title: 'The Secret Base',
    type: 'start',
    summary: 'Finding the hidden entrance.',
    nextIds: [],
    script: "EXT. FOREST - NIGHT\n\nIt was hidden behind the waterfall."
  }
];

// Add chapterId to all nodes for database storage
export const chapter1Nodes = addChapterIdToNodes(chapter1NodesRaw, 'ch_awakening');
export const chapter2Nodes = addChapterIdToNodes(chapter2NodesRaw, 'ch_cafe');
export const chapter3Nodes = addChapterIdToNodes(chapter3NodesRaw, 'ch_secret');

export const chaptersMap: Record<string, SceneNode[]> = {
  'ch_awakening': chapter1Nodes,
  'ch_cafe': chapter2Nodes,
  'ch_secret': chapter3Nodes,
};

// --- Chapters List ---

export const mockChapters: Chapter[] = [
  { id: 'ch_awakening', title: 'Chapter 1: The Awakening', sceneCount: 12, lastEdited: '2 hours ago', status: 'Draft' },
  { id: 'ch_cafe', title: 'Chapter 2: Cafe Meetup', sceneCount: 8, lastEdited: '1 day ago', status: 'Review' },
  { id: 'ch_secret', title: 'Chapter 3: The Secret', sceneCount: 5, lastEdited: '3 days ago', status: 'Draft' },
];

// --- Scenario Events ---

export const initialEvents: ScenarioEvent[] = [
  {
    id: 'SCN-001',
    timing: 'April 7th (Mon) - Morning',
    eventName: 'The Arrival',
    details: 'Alice arrives at the academy gates. The cherry blossoms are falling. She feels nervous but excited.',
    characters: ['Alice'],
    visuals: { type: 'bg', name: 'Academy Gates', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnj3ubDZwiGIvxXny3BlyTikpdTbQagXG2MIDIU8mX-HY59gFZaNtz2TtCyICxGWGVrX6kAWrx5VSJEv664AlHIj_G0ZCMPG2RNFT658ayoqVQOCktL6fuze_37Dt2lWTJnR_zEXXU3Idwof4CLGqLwD1fS094AH7812vKPAC4hS7c_OmTTOUt8z2pdmKo42c7zjz7O25FbO15uTNReqkXnyY_jUgKw8HpBvPAiD6yKTg8mkXRzVkGtXFdQ6i0I-uoq36Y2W0TgnoU' },
    status: 'Final',
    notes: 'Intro BGM starts at line 5.'
  },
  {
    id: 'SCN-002',
    timing: 'April 7th (Mon) - Morning',
    eventName: 'Meeting Kael',
    details: 'Alice runs into Kael near the fountain. He is reading a book and doesn\'t notice her at first.',
    characters: ['Alice', 'Kael'],
    visuals: { type: 'bg', name: 'School Courtyard', url: '' },
    status: 'Final',
    notes: 'Kael needs surprised expression sprite.'
  },
  {
    id: 'SCN-003',
    timing: 'April 7th (Mon) - Afternoon',
    eventName: 'Class Introduction',
    details: 'The teacher introduces Alice to the class. She takes her seat next to a mysterious empty desk.',
    characters: ['Alice', 'Teacher', 'Mob Students'],
    visuals: { type: 'bg', name: 'Classroom A', url: '' },
    status: 'Draft',
    notes: 'Need generic student sprites for background.'
  },
  {
    id: 'SCN-004',
    timing: 'April 7th (Mon) - Evening',
    eventName: 'Library Investigation',
    details: 'Alice sneaks into the old library. She finds a glowing book.',
    characters: ['Alice', 'Unknown'],
    visuals: { type: 'cg', name: 'Glowing Book CG', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvCVhVacAeVfNFw1M78CrYEz9cB1nutMJljQAFyRitZ-at7OVRh1ZdZGgh6dh0fhslu4vrgF83S__P0qr56tde1cm5G4K-0d0WT77DWT7N0HVQEFLybP3VlNWlAbistbM7xdL9RqPB0tqGvP0fKYNXUoTv63mEUKSyr64yy3mZWg6H4Ovhz1gApbFOrYsqOr9r3er7D2ivhVfpCwnZvKW981r6TuSWGIna4XAtPLZ9nOUrkgo99P3rmH7ANa8TO-9SnI38M8877uoA' },
    status: 'Draft',
    notes: 'Lighting effect needed for the book.'
  },
  {
    id: 'SCN-005',
    timing: 'April 7th (Mon) - Night',
    eventName: 'Dormitory Chat',
    details: 'Alice texts Kael about what she saw. He warns her to be careful.',
    characters: ['Alice'],
    visuals: { type: 'bg', name: 'Dorm Room', url: '' },
    status: 'Review',
    notes: 'Phone UI overlay required.'
  }
];

// --- Documents / Files ---

export const createMockSheet = (headers: string[], rows: string[][]) => {
   const data = [];
   // Add headers
   data.push(headers);
   // Add rows
   rows.forEach(r => data.push(r));
   // Fill rest with empty
   for(let i = 0; i < 20; i++) data.push(Array(10).fill(''));
   return data;
};

export const initialFiles: FileItem[] = [
  // Root Folders
  { id: '1', parentId: null, name: '01_Planning', type: 'folder', updatedAt: '2023-10-01' },
  { id: '2', parentId: null, name: '02_Scripts', type: 'folder', updatedAt: '2023-10-05' },
  { id: '3', parentId: null, name: '03_World_Setting', type: 'folder', updatedAt: '2023-10-10' },
  
  // Inside 01_Planning
  { 
     id: '11', parentId: '1', name: 'Master_Schedule', type: 'sheet', updatedAt: '2 days ago', owner: 'Producer',
     content: createMockSheet(
        ['Task', 'Assignee', 'Status', 'Due Date', 'Priority'],
        [
           ['Kickoff', 'All', 'Done', '2023-10-01', 'High'],
           ['Character Design', 'Artist A', 'In Progress', '2023-11-15', 'High'],
           ['Script Draft 1', 'Writer B', 'Pending', '2023-12-01', 'Medium'],
           ['Voice Recording', 'Audio Team', 'Blocked', '2024-01-20', 'Low']
        ]
     )
  },
  { 
     id: '12', parentId: '1', name: 'Budget_Q4', type: 'sheet', updatedAt: '5 days ago', owner: 'Producer',
     content: createMockSheet(
        ['Item', 'Estimated Cost', 'Actual Cost', 'Variance', 'Notes'],
        [
           ['Server Costs', '$500', '$450', '$50', 'Under budget'],
           ['Art Assets', '$2000', '$2000', '$0', 'Contracted'],
           ['Marketing', '$1000', '$0', '$1000', 'Not started'],
           ['Total', '$3500', '$2450', '$1050', '']
        ]
     )
  },
  { 
     id: '13', parentId: '1', name: 'Kickoff_Meeting_Notes', type: 'doc', updatedAt: '1 week ago', owner: 'Director',
     content: `KICKOFF MEETING - ETERNAL ECHOES
Date: Oct 1st, 2023
Attendees: All Staff

1. Project Vision
   A dark fantasy visual novel exploring themes of memory and loss.
   Visual style: Painted backgrounds, anime-style sprites with live2d animation.

2. Core Mechanics
   - Visual Novel standard choice system
   - "Memory Dive" mechanics (puzzle mini-game)
   - Relationship tracking

3. Action Items
   [ ] Finalize main character roster (Writer)
   [ ] Create concept art for the Academy (Artist)
   [ ] Setup project repository (Dev)

4. Next Meeting
   Nov 1st - Milestone Alpha Review`
  },

  // Inside 02_Scripts
  { 
     id: '21', parentId: '2', name: 'Chapter_1_Draft', type: 'doc', updatedAt: 'Yesterday', owner: 'Writer A',
     content: `CHAPTER 1: THE ARRIVAL

SCENE 1
(INT. TRAIN STATION - DAY)

The train screeches to a halt. Steam fills the platform.
ALICE steps out, holding her suitcase tightly.

ALICE
So this is it... The Academy of Echoes.

She looks up at the towering spires in the distance.
A strange bird watches her from a lamppost.`
  },
  { 
     id: '22', parentId: '2', name: 'Chapter_2_Plot', type: 'doc', updatedAt: 'Today', owner: 'Writer B',
     content: `Chapter 2 Outline

- Alice meets the antagonist for the first time in the library.
- The "Forbidden Section" is unlocked.
- Kael goes missing for 2 days.
- Climax: The discovery of the glowing book.`
  },
  { id: '23', parentId: '2', name: 'Character_Voice_Lines', type: 'sheet', updatedAt: '3 days ago', owner: 'Audio Lead' },
  { id: '24', parentId: '2', name: 'Archived_Drafts', type: 'folder', updatedAt: '2023-09-20' },

  // Inside 03_World_Setting
  { 
     id: '31', parentId: '3', name: 'Magic_System_Rules', type: 'doc', updatedAt: '2 weeks ago', owner: 'Designer',
     content: `MAGIC SYSTEM: ECHO RESONANCE

1. Source
   Magic comes from "Echoes" - lingering memories of the deceased.
   
2. Casting
   Users must "resonate" with an object of significance to the memory.
   
3. Limitations
   - Overuse causes memory loss in the caster.
   - Cannot revive the dead, only view their past.`
  },
  { id: '32', parentId: '3', name: 'Location_List', type: 'sheet', updatedAt: '1 month ago', owner: 'Art Lead' },
];