# VinoseF Backend Server

Node.js/Express サーバーとSQLiteデータベースを使用したVinoseF プロジェクトのバックエンド実装です。

## セットアップ

### 1. 依存関係のインストール

```bash
cd server
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成（オプション）:

```env
PORT=3001
NODE_ENV=development
```

### 3. データベースの初期化

```bash
npm run db:init
```

これにより SQLite データベース (`vinose.db`) が自動的に作成され、スキーマが初期化されます。

## 実行

### 開発モード

```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

### 本番モード

```bash
npm run build
npm start
```

## APIエンドポイント

### ヘルスチェック

```
GET /health
```

レスポンス:
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:30:00.000Z"
}
```

### キャラクター

```
GET    /api/characters          # すべてのキャラクターを取得
GET    /api/characters/:id      # 特定のキャラクターを取得
POST   /api/characters          # キャラクターを作成/更新
PUT    /api/characters/:id      # キャラクターを更新
DELETE /api/characters/:id      # キャラクターを削除
```

#### リクエスト例

```bash
# キャラクターを作成
curl -X POST http://localhost:3001/api/characters \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "name": "Alice",
    "role": "Protagonist",
    "age": "17",
    "height": "162cm",
    "avatarUrl": "https://...",
    "coverUrl": "https://...",
    "description": "A curious student...",
    "relationships": [],
    "notes": [],
    "tags": ["Student", "Magic User"]
  }'
```

### アセット

```
GET    /api/assets              # すべてのアセットを取得
GET    /api/assets/:id          # 特定のアセットを取得
POST   /api/assets              # アセットを作成/更新
PUT    /api/assets/:id          # アセットを更新
DELETE /api/assets/:id          # アセットを削除
```

### ファイル

```
GET    /api/files               # すべてのファイルを取得
GET    /api/files/folder/:parentId  # フォルダ内のファイルを取得
GET    /api/files/:id           # 特定のファイルを取得
POST   /api/files               # ファイルを作成/更新
PUT    /api/files/:id           # ファイルを更新
DELETE /api/files/:id           # ファイルを削除
```

## データベース スキーマ

### テーブル

1. **characters** - キャラクター情報
   - id (TEXT PRIMARY KEY)
   - name, role, age, height
   - avatar_url, cover_url
   - description, relationships, notes, tags
   - created_at, updated_at

2. **assets** - アセット (画像、音声など)
   - id (TEXT PRIMARY KEY)
   - name, type, subtype
   - url, size, date
   - created_at, updated_at

3. **files** - ドキュメント/スプレッドシート
   - id (TEXT PRIMARY KEY)
   - parent_id (フォルダ階層)
   - name, type (folder/doc/sheet)
   - content (JSON形式)
   - owner, url
   - created_at, updated_at

4. **scene_nodes** - シーンノード
   - id, chapter_id, title, type
   - script, background, bgm, sfx
   - flags, next_ids

5. **chapters** - チャプター
   - id, title, scene_count
   - status, last_edited



7. **project_meta** - プロジェクトメタデータ
   - key, value, updated_at

## フロントエンド設定

フロントエンドでバックエンドを使用するには、`.env` ファイルを設定します:

```env
# SQLiteバックエンドを使用
REACT_APP_USE_SQLITE=true

# バックエンドURL
REACT_APP_BACKEND_URL=http://localhost:3001

# ローカルストレージの永続化を無効化
REACT_APP_PERSISTENCE_ENABLED=false
```

## 構造

```
server/
├── src/
│   ├── index.ts           # メインサーバーファイル
│   ├── db/
│   │   ├── connection.ts  # データベース接続
│   │   ├── init.ts        # スキーマ初期化
│   │   ├── characters.ts  # キャラクターDAL
│   │   ├── assets.ts      # アセットDAL
│   │   └── files.ts       # ファイルDAL
│   └── routes/
│       ├── characters.ts  # キャラクターAPI
│       ├── assets.ts      # アセットAPI
│       └── files.ts       # ファイルAPI
├── dist/                  # コンパイル済みJavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 技術スタック

- **フレームワーク**: Express.js
- **言語**: TypeScript
- **データベース**: SQLite3
- **CORS**: サポート済み

## トラブルシューティング

### ポート既に使用中

別のポートを指定:
```bash
PORT=3002 npm run dev
```

### データベース接続エラー

データベースファイルが存在するか確認:
```bash
ls -la vinose.db
```

再初期化:
```bash
rm vinose.db
npm run db:init
```

### CORSエラー

フロントエンドから異なるオリジンでアクセスしている場合、CORS設定を確認してください。デフォルトではすべてのオリジンが許可されています。

## ライセンス

MIT
