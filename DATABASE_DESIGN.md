# VinoseF - すべてのデータベース実装ガイド

このドキュメントは、VinoseF プロジェクトがすべてのデータを SQLite データベースを通して管理する設計を説明しています。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React + Vite)                                     │
├─────────────────────────────────────────────────────────────┤
│ • DatabaseContext (SQLiteadapter デフォルト)               │
│ • BackendStatusContext (バックエンド接続状態監視)           │
│ • すべてのコンポーネントが useDatabase() を使用            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Node.js/Express)                                   │
├─────────────────────────────────────────────────────────────┤
│ • /api/characters    - キャラクター CRUD                    │
│ • /api/assets        - アセット CRUD                        │
│ • /api/files         - ファイル/フォルダ CRUD              │
│ • /api/chapters      - チャプター CRUD                      │
│ • /api/scene-nodes   - シーンノード CRUD                   │
│ • /api/events        - シナリオイベント CRUD               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ SQLite Database (vinose.db)                                 │
├─────────────────────────────────────────────────────────────┤
│ • characters         - キャラクター情報                     │
│ • assets             - メディアアセット                     │
│ • files              - ドキュメント/スプレッドシート       │
│ • chapters           - 章立て構成                           │
│ • scene_nodes        - シーン/ノード要素                    │
│ • scenario_events    - イベント管理                         │
│ • project_meta       - プロジェクトメタデータ              │
└─────────────────────────────────────────────────────────────┘
```

## 起動方法

### 1. すべて同時起動（推奨）
```bash
cd /home/manaka/VinoseF
npm run dev
```
以下が自動的に起動します:
- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:3001
- SQLite データベース: サーバープロセス内に自動初期化

### 2. 個別起動
```bash
# バックエンドのみ
npm run dev:backend

# フロントエンドのみ
npm run dev:frontend
```

## API エンドポイント

### ヘルスチェック
```
GET /health
Response: { "status": "ok", "timestamp": "2026-01-19T..." }
```

### キャラクター
```
GET    /api/characters           # すべてのキャラクターを取得
GET    /api/characters/:id       # 特定のキャラクターを取得
POST   /api/characters           # キャラクターを作成/更新
PUT    /api/characters/:id       # キャラクターを更新
DELETE /api/characters/:id       # キャラクターを削除
```

**リクエスト例:**
```json
POST /api/characters
{
  "id": "char-001",
  "name": "Alice",
  "role": "Protagonist",
  "age": "17",
  "height": "162cm",
  "avatarUrl": "https://example.com/alice.png",
  "coverUrl": "https://example.com/alice-cover.png",
  "description": "The main character of the story",
  "relationships": [],
  "notes": [],
  "tags": ["Student", "Magic User"]
}
```

### アセット
```
GET    /api/assets               # すべてのアセットを取得
GET    /api/assets/:id           # 特定のアセットを取得
POST   /api/assets               # アセットを作成/更新
PUT    /api/assets/:id           # アセットを更新
DELETE /api/assets/:id           # アセットを削除
```

### ファイル
```
GET    /api/files                # すべてのファイルを取得
GET    /api/files/folder/:parentId  # フォルダ内のファイルを取得
GET    /api/files/:id            # 特定のファイルを取得
POST   /api/files                # ファイルを作成/更新
PUT    /api/files/:id            # ファイルを更新
DELETE /api/files/:id            # ファイルを削除
```

### チャプター
```
GET    /api/chapters             # すべてのチャプターを取得
GET    /api/chapters/:id         # 特定のチャプターを取得
POST   /api/chapters             # チャプターを作成/更新
PUT    /api/chapters/:id         # チャプターを更新
DELETE /api/chapters/:id         # チャプターを削除
```

**リクエスト例:**
```json
POST /api/chapters
{
  "id": "ch-001",
  "title": "第一章 始まり",
  "sceneCount": 5,
  "status": "draft"
}
```

### シーンノード
```
GET    /api/scene-nodes                    # すべてのノードを取得
GET    /api/scene-nodes/chapter/:chapterId # チャプター内のノードを取得
GET    /api/scene-nodes/:id                # 特定のノードを取得
POST   /api/scene-nodes                    # ノードを作成/更新
PUT    /api/scene-nodes/:id                # ノードを更新
DELETE /api/scene-nodes/:id                # ノードを削除
```

**リクエスト例:**
```json
POST /api/scene-nodes
{
  "id": "node-001",
  "chapterId": "ch-001",
  "title": "Opening Scene",
  "type": "narration",
  "script": "The story begins...",
  "background": "night-forest",
  "bgm": "mysterious-theme",
  "sfx": "wind-sound",
  "flags": {},
  "nextIds": ["node-002"]
}
```

### シナリオイベント
```
GET    /api/events               # すべてのイベントを取得
GET    /api/events/:id           # 特定のイベントを取得
POST   /api/events               # イベントを作成/更新
PUT    /api/events/:id           # イベントを更新
DELETE /api/events/:id           # イベントを削除
```

## フロントエンド設定

### 環境変数 (.env.local)

```dotenv
# SQLite バックエンド有効（デフォルト: true）
REACT_APP_USE_SQLITE=true

# バックエンド URL
REACT_APP_BACKEND_URL=http://localhost:3001
```

**デフォルト動作:**
- ✅ SQLite バックエンド有効（推奨）
- ✅ バックエンド接続失敗時は警告表示
- ✅ すべてのデータはサーバー側 SQLite に永続化

### React Context の使用

```typescript
import { useDatabase } from './contexts/DatabaseContext';
import { useBackendStatus } from './contexts/BackendStatusContext';

function MyComponent() {
  const db = useDatabase();
  const backendStatus = useBackendStatus();

  // キャラクターを取得
  const characters = await db.getCharacters();
  
  // 新しいキャラクターを保存
  await db.saveCharacter({
    id: 'new-char',
    name: 'Bob',
    // ...
  });

  // バックエンド接続状態を確認
  if (!backendStatus.connected) {
    console.warn('Database connection lost:', backendStatus.message);
  }
}
```

## データベーススキーマ

### characters テーブル
```sql
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  age TEXT,
  height TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  description TEXT,
  relationships JSON,
  notes JSON,
  tags JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### chapters テーブル
```sql
CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scene_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  last_edited TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### scene_nodes テーブル
```sql
CREATE TABLE scene_nodes (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT,
  script TEXT,
  background TEXT,
  bgm TEXT,
  sfx TEXT,
  flags JSON,
  next_ids JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

### scenario_events テーブル
```sql
CREATE TABLE scenario_events (
  id TEXT PRIMARY KEY,
  timing TEXT,
  event_name TEXT NOT NULL,
  details TEXT,
  characters JSON,
  visuals TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### files テーブル
```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'doc',
  content JSON,
  owner TEXT,
  url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES files(id)
);
```

### assets テーブル
```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  subtype TEXT,
  url TEXT,
  size TEXT,
  date TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## トラブルシューティング

### バックエンドに接続できない
1. バックエンドが起動しているか確認: `http://localhost:3001/health`
2. ポートの競合を確認: `lsof -i :3001`
3. `REACT_APP_BACKEND_URL` が正しいか確認
4. ファイアウォール設定を確認

### データが保存されない
1. バックエンド コンソールでエラーを確認
2. SQLite ファイルが作成されているか確認: `server/vinose.db`
3. バックエンドのログレベルを上げる: `NODE_DEBUG=* npm run dev:backend`

### データベース スキーマエラー
```bash
# データベースをリセット
cd server
rm vinose.db
npm run db:init
```

## パフォーマンス最適化

### キャッシング
フロントエンドは自動的にデータをメモリキャッシュします:
- 文字コード: 5分間キャッシュ
- アセット: 10分間キャッシュ
- ファイル: 5分間キャッシュ

### バッチ操作
複数の操作を一度に実行する場合は、バックエンドで対応するバッチ API を使用してください（将来実装予定）。

## セキュリティ

### 現在
- ✅ CORS 有効（開発環境）
- ✅ JSON 10MB制限
- ✅ エラーメッセージの詳細ログ

### 将来の実装
- 🔄 JWT 認証
- 🔄 ロールベースアクセス制御（RBAC）
- 🔄 レート制限
- 🔄 リクエスト署名

## まとめ

VinoseF は完全に SQLite ベースのデータベース設計に移行しました：

1. **フロントエンド**: React アプリケーションがすべてのデータ操作を REST API 経由で行う
2. **バックエンド**: Express.js サーバーが SQLite データベースへのすべてのアクセスを管理
3. **永続性**: すべてのデータは `server/vinose.db` に永続化される
4. **スケーラビリティ**: 将来的に MongoDB、PostgreSQL など他のデータベースに切り替え可能な設計

開発時は `npm run dev` で両サーバーを同時起動し、統合された開発体験を得られます。
