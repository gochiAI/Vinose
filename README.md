<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VinoseF - Visual Novel Scenario Editor

A comprehensive visual novel scenario management and editing tool with cross-chapter branching support.

View original AI Studio template: https://ai.studio/apps/drive/1TrwgblJNhesOnf8TIN6_oEW501SPcuDn

## Features

- **Chapter & Scene Management**: Organize your story structure with chapters and scene nodes
- **Visual Flow Canvas**: Visualize scene connections and branching paths
- **Script Editor**: Rich text editor for dialogue, narration, media, and branching logic
- **Cross-Chapter Linking**: Link end nodes to start nodes in other chapters for complex narratives
- **Scene Metadata**: Track status (Draft/Review/Final), scene dates, and summaries
- **Auto-Layout**: Automatic left-to-right node layout for clear visualization
- **Assets & Characters**: Manage backgrounds, sprites, audio, and character profiles
- **Documents**: Built-in document and spreadsheet editor for planning

## Cross-Chapter Linking

End nodes can connect to other chapters:
- Select an end node in the flow canvas
- Open the Inspector panel (right sidebar)
- Under "Cross-Chapter Link", choose a target chapter
- Optionally specify an entry node (defaults to the chapter's start node)
- Visual indicator (purple link icon) appears on linked end nodes

This enables complex branching narratives where a chapter can have multiple endings leading to different subsequent chapters.

## Run Locally

**Prerequisites:** Node.js 18+

### Frontend (Vite + React)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (if using AI features)
3. Run the app:
   ```bash
   npm run dev
   ```

### Backend (Express + SQLite)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Run the server:
   ```bash
   npm run dev
   ```

The backend runs on `http://localhost:3001` and the frontend connects automatically.

## Architecture

- **Frontend**: React + TypeScript + Vite + React Router
- **Backend**: Express + SQLite (better-sqlite3)
- **State**: DatabaseContext with SQLiteDatabaseAdapter for REST communication
- **Persistence**: All data stored in SQLite database (`server/database.sqlite`)

## Scene Node Types

- **start**: Chapter entry point (single transition only)
- **scene**: Standard content node (dialogue, narration, media, branching)
- **end**: Chapter exit point (can link to other chapters)

## Development Notes

- Auto-generated start/end nodes on chapter creation
- Script parsing extracts `nextIds` from `[GOTO: nodeId]` and `[CHOICE]` blocks
- Cross-chapter links stored separately from intra-chapter `nextIds`
- FlowCanvas uses BFS auto-layout for node positioning

