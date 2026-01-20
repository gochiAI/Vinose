// react-routerルーティング設計案
// URLと画面の対応
//
// /dashboard         ... Dashboard
// /documents         ... DocumentsPage
// /characters        ... CharactersPage
// /assets            ... AssetsPage
// /settings          ... SettingsPage
// /chapter-list      ... ChapterListPage
// /chapter/:chapter  ... ChapterPage（chapter名をパラメータで渡す）
// /editor/:nodeId    ... EditorView（nodeIdをパラメータで渡す）

// これに従い、App.tsxのViewState分岐をRoute/Routesで置き換える
