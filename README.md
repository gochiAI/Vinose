# Visual Novel Scenario Editor

## Description

A web application for centrally managing scenarios and related assets (characters, locations, items) for adventure and visual novel game development. It features a timeline-based scene editor, a comprehensive project database, and JSON-based data import/export capabilities.

## Key Features

*   **Visual Timeline Editor:** Intuitively map out your story's flow by creating and connecting scenes in a visual graph.
*   **Project Database:** A central hub to manage all your game's components: characters, locations, items, memos, plots, tasks, and assets (backgrounds, sprites, SFX).
*   **Character Relationship Graph:** Visualize the complex web of relationships between your characters.
*   **AI-Powered Assistant (Powered by Google Gemini):**
    *   Generate rich character descriptions.
    *   Create entire scene event blocks from natural language prompts.
    *   Brainstorm ideas with a context-aware chatbot.
*   **Rapid Event Creation:** Use a powerful command-line interface within the scene editor to quickly add dialogue, actions, and choices.
*   **Import / Export:** Save your entire project to a single `.vns` file for easy backup and sharing.
*   **Cloud Sync:** Optionally sync your project data across multiple devices using Google Firebase.
*   **Customization:** Supports both Light and Dark themes.
*   **Multi-language:** Interface available in English and Japanese.

## How to Use

1.  **Start Your Project:** Give your project a name by clicking on the title in the header.
2.  **Build Your World:** Use the **Project DB** sidebar to add characters, locations, items, and upload assets like background images and sound effects.
3.  **Create Scenes:** In the **Timeline View**, click "Add Scene" or right-click on the canvas to create a new scene.
4.  **Write Your Story:** Click on a scene to open the **Scene Editor**. Add events like dialogue, narration, choices, and background changes.
    *   Use the UI controls to add events one by one.
    *   For faster creation, use the **Command Mode** to write multiple events in plain text.
5.  **Connect Characters:** Switch to the **Character Graph View** to define relationships between your characters.
6.  **Get Creative Help:** Use the **AI Assistant** view to chat with the AI for ideas, or use the Sparkles icon ✨ in editors to generate specific content.
7.  **Save Your Work:** Regularly use the **Export** button in the header to save your project as a `.vns` file. Use **Import** to load a project file.

## AI Assistant (Google Gemini)

This application leverages the power of Google's Gemini API to assist in the creative process.

*   **Setup:** To use the AI features, you must have an `API_KEY` environment variable configured.
*   **Capabilities:**
    *   **Character Generation:** Automatically generate detailed descriptions for your characters based on their name and a simple prompt.
    *   **Scene Generation:** Describe a scene in plain English, and the AI will generate the corresponding sequence of commands for you to insert.
    *   **Creative Chatbot:** Brainstorm plot points, character arcs, or dialogue ideas. The chatbot has context on your entire project.

## Cloud Sync (Firebase)

Cloud sync is an optional feature that allows you to save your project data to the cloud using Google Firebase. This enables you to access and edit your project from multiple devices and ensures your data is backed up automatically.

### How to Set Up Cloud Sync

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Add a Web App:** In your project's dashboard, add a new web application.
3.  **Get Config Object:** After creating the web app, Firebase will provide you with a `firebaseConfig` object. It will look something like this:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "1:..."
    };
    ```
4.  **Enable Services:**
    *   In the Firebase console, go to **Authentication** -> **Sign-in method** and enable the **Google** provider.
    *   Go to **Firestore Database** and create a new database. Start in **test mode** for easy setup (you can configure security rules later).
5.  **Set Environment Variable:** You need to provide the `firebaseConfig` object to the application through an environment variable named `FIREBASE_CONFIG`. The value should be the entire JavaScript object, stringified as JSON.

    For example, in a `.env` file, it would look like this:
    `FIREBASE_CONFIG='{"apiKey":"AIzaSy...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'`

Once the `FIREBASE_CONFIG` environment variable is set, the application will automatically enable cloud sync features, including Google login and real-time data synchronization.

## Data Persistence

By default, your project data is automatically saved in your browser's local storage (IndexedDB).

**Local Storage:**
Your work is saved as you go. However, since the data is stored locally, it's crucial to **use the Export feature regularly** to create backup files (`.vns`). This will prevent data loss if your browser's cache is cleared.

**Cloud Sync:**
For automatic cloud backups and multi-device access, you can optionally set up Firebase sync (see the "Cloud Sync" section for details). When enabled, your data will be stored securely in your own Firebase project.

## Deploy to Firebase Hosting

You can deploy this application as a private web app using Firebase Hosting for free. This allows you to access it from anywhere without keeping your local computer running.

### Prerequisites

*   You have [Node.js](https://nodejs.org/) installed.
*   You have a Google account.

### Steps

1.  **Install Firebase CLI:**
    Open your terminal or command prompt and run this command to install the Firebase Command Line Interface:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase:**
    Run the following command and follow the prompts to log in with your Google account:
    ```bash
    firebase login
    ```

3.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click on "Add project" and follow the on-screen instructions to create a new project. You can disable Google Analytics if you don't need it.

4.  **Configure Project ID:**
    *   Open the `.firebaserc` file in this project's root directory.
    *   Replace `"YOUR_FIREBASE_PROJECT_ID"` with the **Project ID** of the Firebase project you just created. You can find the Project ID in the "Project settings" (click the gear icon ⚙️) in the Firebase Console.
    *   Save the `.firebaserc` file.

5.  **Deploy the Application:**
    Navigate to the project's root directory in your terminal and run:
    ```bash
    firebase deploy --only hosting
    ```

After the deployment is complete, the terminal will show you a "Hosting URL". You can open this URL in your browser to use your deployed application!


---

# ビジュアルノベル・シナリオエディタ

## 概要

アドベンチャーゲームやビジュアルノベル開発のために、シナリオと関連アセット（キャラクター、場所、アイテムなど）を一元管理するためのWebアプリケーションです。タイムラインベースのシーンエディタ、包括的なプロジェクトデータベース、JSONベースのデータインポート・エクスポート機能を備えています。

## 主な機能

*   **ビジュアルタイムラインエディタ:** シーンを作成し、視覚的なグラフでつなぎ合わせることで、物語の流れを直感的に設計できます。
*   **プロジェクトデータベース:** キャラクター、場所、アイテム、メモ、プロット、タスク、アセット（背景、スプライト、効果音）など、ゲームの全要素を管理する中心的なハブです。
*   **キャラクター相関図:** キャラクター間の複雑な関係性を視覚化します。
*   **AIアシスタント (Powered by Google Gemini):**
    *   豊かなキャラクター設定を生成します。
    *   自然言語のプロンプトから、シーン全体のイベントブロックを作成します。
    *   プロジェクトの文脈を理解したチャットボットとブレインストーミングができます。
*   **高速なイベント作成:** シーンエディタ内の強力なコマンドラインインターフェースを使用して、会話、行動、選択肢を素早く追加できます。
*   **インポート / エクスポート:** プロジェクト全体を単一の `.vns` ファイルに保存し、バックアップや共有を容易にします。
*   **クラウド同期:** オプションでGoogle Firebaseを使用して、プロジェクトデータを複数のデバイス間で同期できます。
*   **カスタマイズ:** ライトテーマとダークテーマの両方をサポート。
*   **多言語対応:** インターフェースは英語と日本語で利用可能です。

## 使い方

1.  **プロジェクトの開始:** ヘッダーにあるタイトルをクリックして、プロジェクトに名前を付けます。
2.  **世界観の構築:** **プロジェクトDB**サイドバーを使用して、キャラクター、場所、アイテムを追加し、背景画像や効果音などのアセットをアップロードします。
3.  **シーンの作成:** **タイムラインビュー**で「シーンを追加」ボタンをクリックするか、キャンバスを右クリックして新しいシーンを作成します。
4.  **物語の執筆:** シーンをクリックして**シーンエディタ**を開きます。会話、ナレーション、選択肢、背景変更などのイベントを追加します。
    *   UIコントロールを使って一つずつイベントを追加できます。
    *   より高速に作成したい場合は、**コマンドモード**を使用して複数のイベントをテキストで記述できます。
5.  **キャラクターの関連付け:** **相関図ビュー**に切り替えて、キャラクター間の関係を定義します。
6.  **創作のサポート:** **AIアシスタント**ビューでAIとチャットしてアイデアを得たり、エディタ内のキラキラアイコン ✨ を使って特定のコンテンツを生成したりできます。
7.  **作業の保存:** ヘッダーにある**エクスポート**ボタンを定期的に使用して、プロジェクトを `.vns` ファイルとして保存してください。**インポート**を使用してプロジェクトファイルを読み込みます。

## AIアシスタント (Google Gemini)

このアプリケーションは、GoogleのGemini APIの力を活用して、創作プロセスを支援します。

*   **設定:** AI機能を使用するには、`API_KEY` 環境変数を設定する必要があります。
*   **機能:**
    *   **キャラクター生成:** キャラクター名と簡単なプロンプトに基づいて、詳細な説明を自動生成します。
    *   **シーン生成:** シーンを平易な言葉で説明すると、AIが対応するコマンドシーケンスを生成して挿入できます。
    *   **クリエイティブ・チャットボット:** プロットのポイント、キャラクターのアーク、会話のアイデアについてブレインストーミングできます。チャットボットはプロジェクト全体の文脈を理解しています。

## クラウド同期 (Firebase)

クラウド同期は、Google Firebase を使用してプロジェクトデータをクラウドに保存するためのオプショナル機能です。これにより、複数のデバイスからプロジェクトにアクセスして編集でき、データが自動的にバックアップされるようになります。

### クラウド同期の設定方法

1.  **Firebaseプロジェクトの作成:** [Firebaseコンソール](https://console.firebase.google.com/)にアクセスし、新しいプロジェクトを作成します。
2.  **ウェブアプリの追加:** プロジェクトのダッシュボードで、新しいウェブアプリケーションを追加します。
3.  **設定オブジェクトの取得:** ウェブアプリを作成すると、Firebaseから`firebaseConfig`オブジェクトが提供されます。以下のような形式です。
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "1:..."
    };
    ```
4.  **サービスの有効化:**
    *   Firebaseコンソールの **Authentication** -> **Sign-in method** に移動し、**Google** プロバイダを有効にします。
    *   **Firestore Database** に移動し、新しいデータベースを作成します。簡単なセットアップのために**テストモード**で開始してください（セキュリティルールは後で設定できます）。
5.  **環境変数の設定:** `firebaseConfig`オブジェクトを、`FIREBASE_CONFIG`という名前の環境変数としてアプリケーションに提供する必要があります。値は、JavaScriptオブジェクト全体をJSONとして文字列化したものである必要があります。

    例えば、`.env`ファイルでは次のようになります。
    `FIREBASE_CONFIG='{"apiKey":"AIzaSy...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'`

`FIREBASE_CONFIG`環境変数が設定されると、アプリケーションはGoogleログインやリアルタイムのデータ同期を含むクラウド同期機能を自動的に有効にします。

## データ永続性

デフォルトでは、プロジェクトデータはブラウザのローカルストレージ（IndexedDB）に自動的に保存されます。

**ローカルストレージ:**
作業内容は随時保存されます。ただし、データはローカルに保存されるため、バックアップファイル（`.vns`）を作成するために**定期的にエクスポート機能を使用する**ことが非常に重要です。これにより、ブラウザのキャッシュがクリアされた場合のデータ損失を防ぐことができます。

**クラウド同期:**
自動的なクラウドバックアップと複数デバイスからのアクセスのために、オプションでFirebase同期を設定できます（詳細は「クラウド同期」セクションを参照）。有効にすると、データはあなた自身のFirebaseプロジェクトに安全に保存されます。

## Firebase Hostingへのデプロイ

このアプリケーションをFirebase Hostingにデプロイすることで、自分専用のWebアプリとして無料で公開できます。これにより、ローカルPCを起動し続けることなく、どこからでもアクセスできるようになります。

### 前提条件

*   [Node.js](https://nodejs.org/)がインストールされていること。
*   Googleアカウントを持っていること。

### 手順

1.  **Firebase CLIのインストール:**
    ターミナル（またはコマンドプロンプト）を開き、以下のコマンドを実行してFirebaseのコマンドラインツールをインストールします。
    ```bash
    npm install -g firebase-tools
    ```

2.  **Firebaseへのログイン:**
    次のコマンドを実行し、表示される指示に従ってGoogleアカウントでログインします。
    ```bash
    firebase login
    ```

3.  **Firebaseプロジェクトの作成:**
    *   [Firebaseコンソール](https://console.firebase.google.com/)にアクセスします。
    *   「プロジェクトを追加」をクリックし、画面の指示に従って新しいプロジェクトを作成します。Googleアナリティクスは不要であれば無効にして構いません。

4.  **プロジェクトIDの設定:**
    *   このプロジェクトのルートディレクトリにある `.firebaserc` ファイルを開きます。
    *   `"YOUR_FIREBASE_PROJECT_ID"` の部分を、先ほど作成したFirebaseプロジェクトの **プロジェクトID** に書き換えます。プロジェクトIDは、Firebaseコンソールの「プロジェクトの設定」（歯車アイコン⚙️）で確認できます。
    *   `.firebaserc` ファイルを保存します。

5.  **アプリケーションのデプロイ:**
    ターミナルでこのプロジェクトのルートディレクトリに移動し、以下のコマンドを実行します。
    ```bash
    firebase deploy --only hosting
    ```

デプロイが完了すると、ターミナルに「ホスティングURL」が表示されます。このURLをブラウザで開くと、デプロイされたあなたのアプリケーションを利用できます！
