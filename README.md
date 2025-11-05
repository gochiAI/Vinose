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

## Data Persistence

Your project data is automatically saved in your browser's local storage (IndexedDB). This means your work is saved as you go.

**Important:** Since the data is stored locally, it's crucial to **use the Export feature regularly** to create backup files (`.vns`). This will prevent data loss if your browser's cache is cleared.

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

## データ永続性

プロジェクトデータは、お使いのブラウザのローカルストレージ（IndexedDB）に自動的に保存されます。これにより、作業内容は随時保存されます。

**重要:** データはローカルに保存されるため、バックアップファイル（`.vns`）を作成するために**定期的にエクスポート機能を使用する**ことが非常に重要です。これにより、ブラウザのキャッシュがクリアされた場合のデータ損失を防ぐことができます。
