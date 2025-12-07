import React, { useState, useEffect } from 'react';
import { useProjectData } from '../hooks/useProjectData';
import { BranchInfo } from '../types';

// 補助: 安定した色生成（ブランチ名→色）
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function shortId(id: string) {
  return id.slice(0, 7);
}

// Git Graphライクなレーン描画コンポーネント
interface CommitGraphProps {
  versions: Array<{
    id: string;
    note: string;
    createdAt: any;
    branch: string;
    parentId: string | null;
    mergeParentId: string | null;
    type: string;
  }>;
  onCheckout: (versionId: string) => void;
}

const CommitGraph: React.FC<CommitGraphProps> = ({ versions, onCheckout }) => {
  // レーン割り当て: 各コミットにレーン番号を付ける
  const LANE_WIDTH = 24;
  const ROW_HEIGHT = 60;
  const GRAPH_LEFT_MARGIN = 48; // グラフ左余白（スマホでは小さく）
  
  // コミットIDからインデックスへのマップ
  const idToIndex = new Map<string, number>();
  versions.forEach((v, i) => idToIndex.set(v.id, i));

  // レーン割り当てロジック: 各コミットが占有するレーン
  const lanes = new Map<string, number>();
  const branchLanes = new Map<string, number>(); // ブランチごとの優先レーン
  let nextLane = 0;

  versions.forEach((v) => {
    // 既存のブランチレーンがあればそれを使う
    if (branchLanes.has(v.branch)) {
      lanes.set(v.id, branchLanes.get(v.branch)!);
    } else {
      // 新しいレーンを割り当て
      lanes.set(v.id, nextLane);
      branchLanes.set(v.branch, nextLane);
      nextLane++;
    }
  });

  return (
    <div className="relative overflow-x-auto">
      {versions.map((v, idx) => {
        const lane = lanes.get(v.id) || 0;
        const x = lane * LANE_WIDTH + 12;
        const y = idx * ROW_HEIGHT + 30;
        const color = stringToColor(v.branch);

        // 親への線を描画
        const parentIdx = v.parentId ? idToIndex.get(v.parentId) : null;
        const mergeParentIdx = v.mergeParentId ? idToIndex.get(v.mergeParentId) : null;

        return (
          <div key={v.id} className="relative" style={{ height: ROW_HEIGHT, minWidth: '100%' }}>
            {/* SVGレイヤー */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: 'min(200px, 25vw)', height: ROW_HEIGHT }}
            >
              {/* 親コミットへの線 */}
              {parentIdx !== null && parentIdx !== undefined && (
                (() => {
                  const parentLane = lanes.get(versions[parentIdx].id) || 0;
                  const parentX = parentLane * LANE_WIDTH + 12;
                  const parentY = (parentIdx - idx) * ROW_HEIGHT + 30;
                  
                  return (
                    <line
                      x1={x}
                      y1={30}
                      x2={parentX}
                      y2={parentY}
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  );
                })()
              )}
              
              {/* マージ親への線 */}
              {mergeParentIdx !== null && mergeParentIdx !== undefined && (
                (() => {
                  const mergeLane = lanes.get(versions[mergeParentIdx].id) || 0;
                  const mergeX = mergeLane * LANE_WIDTH + 12;
                  const mergeY = (mergeParentIdx - idx) * ROW_HEIGHT + 30;
                  
                  return (
                    <line
                      x1={x}
                      y1={30}
                      x2={mergeX}
                      y2={mergeY}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      opacity="0.6"
                    />
                  );
                })()
              )}

              {/* コミットノード */}
              <circle
                cx={x}
                cy={30}
                r="6"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>

            {/* コミット情報 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ml-12 sm:ml-48">
              <div className="flex-1 p-2 border border-border rounded-md hover:bg-secondary min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                    {shortId(v.id)}
                  </span>
                  <span className="text-sm break-words min-w-0">{v.note || '(no message)'}</span>
                  {v.type === 'merge' && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded shrink-0">
                      merge
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span
                    className="font-mono px-1.5 py-0.5 rounded border shrink-0"
                    style={{ borderColor: color, color: color }}
                  >
                    {v.branch}
                  </span>
                  {v.createdAt?.seconds && (
                    <span className="break-all">{new Date(v.createdAt.seconds * 1000).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onCheckout(v.id)}
                className="px-3 py-1 text-xs border border-border rounded-md hover:bg-secondary shrink-0 self-start sm:self-center"
                title="このバージョンにチェックアウト"
              >
                Checkout
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const VersionControl = () => {
  const { 
    saveVersion, 
    currentBranch,
    detachedHead,
    hasUnsavedChanges,
    createBranch, 
    switchBranch, 
    deleteBranch, 
    listBranches,
    mergeBranch,
    getVersionHistory,
    checkoutVersion,
  } = useProjectData();
  const [note, setNote] = useState('');
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [mergeBranchName, setMergeBranchName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'commit' | 'branches' | 'history'>('commit');
  const [versions, setVersions] = useState<Array<{id:string; note:string; createdAt:any; branch:string; parentId:string|null; mergeParentId:string|null; type:string;}>>([]);

  useEffect(() => {
    loadBranches();
    loadVersions();
  }, [currentBranch]);

  const loadBranches = async () => {
    try {
      const branchList = await listBranches();
      setBranches(branchList);
    } catch (error) {
      console.error('ブランチ一覧の取得に失敗:', error);
    }
  };

  const loadVersions = async () => {
    try {
      const hist = await getVersionHistory();
      setVersions(hist as any);
    } catch (e) {
      console.error('バージョン履歴の取得に失敗:', e);
    }
  };

  const handleSaveVersion = async () => {
    if (!note.trim()) {
      alert('コミットメッセージを入力してください。');
      return;
    }
    try {
      await saveVersion(note);
      alert(`Changes committed to '${currentBranch}'`);
      setNote('');
    } catch (error) {
      console.error('コミット中にエラーが発生しました:', error);
      alert('コミット中にエラーが発生しました。');
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      alert('ブランチ名を入力してください。');
      return;
    }
    try {
      await createBranch(newBranchName.trim());
      alert(`Branch '${newBranchName}' created`);
      setNewBranchName('');
      loadBranches();
    } catch (error: any) {
      console.error('ブランチ作成中にエラーが発生しました:', error);
      alert(error.message || 'ブランチ作成中にエラーが発生しました。');
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    try {
      await switchBranch(branchName);
      alert(`Switched to branch '${branchName}'`);
    } catch (error: any) {
      console.error('ブランチ切り替え中にエラーが発生しました:', error);
      alert(error.message || 'ブランチ切り替え中にエラーが発生しました。');
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!confirm(`Delete branch '${branchName}'?`)) {
      return;
    }
    try {
      await deleteBranch(branchName);
      alert(`Branch '${branchName}' deleted`);
      loadBranches();
    } catch (error: any) {
      console.error('ブランチ削除中にエラーが発生しました:', error);
      alert(error.message || 'ブランチ削除中にエラーが発生しました。');
    }
  };

  const handleMergeBranch = async () => {
    if (!mergeBranchName) {
      alert('マージするブランチを選択してください。');
      return;
    }
    if (!confirm(`Merge '${mergeBranchName}' into '${currentBranch}'?`)) {
      return;
    }
    try {
      await mergeBranch(mergeBranchName);
      alert(`Merged '${mergeBranchName}' into '${currentBranch}'`);
      setMergeBranchName('');
    } catch (error: any) {
      console.error('ブランチマージ中にエラーが発生しました:', error);
      alert(error.message || 'ブランチマージ中にエラーが発生しました。');
    }
  };

  const handleCheckoutVersion = async (versionId: string) => {
    if (!confirm(`このバージョンにチェックアウトしますか？(hard reset)\n次回コミット時、現在のHEADは孤立します。`)) {
      return;
    }
    try {
      await checkoutVersion(versionId);
      alert(`Checked out to ${shortId(versionId)} (detached HEAD)`);
      loadVersions();
    } catch (error: any) {
      console.error('チェックアウト中にエラーが発生しました:', error);
      alert(error.message || 'チェックアウト中にエラーが発生しました。');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* タブナビゲーション */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('commit')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'commit'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Commit
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'branches'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Branches
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          History
        </button>
      </div>

      {/* Commitタブ */}
      {activeTab === 'commit' && (
        <div className="space-y-4">
          {/* 現在のブランチ表示 */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6.5a.75.75 0 0 1-1.5 0V5.372a2.25 2.25 0 0 1-1.5-2.122zm-5 9.5a2.25 2.25 0 1 1 3 2.122v-.878a.75.75 0 0 1-1.5 0v.878a2.25 2.25 0 0 1-1.5-2.122z"/>
            </svg>
            <span className="font-mono font-semibold">{currentBranch}</span>
            {detachedHead && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                detached HEAD ({shortId(detachedHead)})
              </span>
            )}
          </div>

          {/* コミットメッセージ入力 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Commit message
            </label>
            <textarea
              placeholder="Summary (required)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full p-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* コミットボタン */}
          <button
            onClick={handleSaveVersion}
            disabled={!note.trim() || !hasUnsavedChanges}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Commit to {currentBranch}
          </button>
          {!hasUnsavedChanges && (
            <p className="text-xs text-muted-foreground text-center">
              変更がないためコミットできません
            </p>
          )}
        </div>
      )}

      {/* Branchesタブ */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          {/* ブランチ一覧 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Your branches
            </h4>
            <div className="space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    branch.name === currentBranch
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6.5a.75.75 0 0 1-1.5 0V5.372a2.25 2.25 0 0 1-1.5-2.122zm-5 9.5a2.25 2.25 0 1 1 3 2.122v-.878a.75.75 0 0 1-1.5 0v.878a2.25 2.25 0 0 1-1.5-2.122z"/>
                    </svg>
                    <span className={`font-mono ${branch.name === currentBranch ? 'font-bold' : ''}`}>
                      {branch.name}
                    </span>
                    {branch.name === currentBranch && (
                      <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full">
                        current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {branch.name !== currentBranch && (
                      <button
                        onClick={() => handleSwitchBranch(branch.name)}
                        className="px-3 py-1 text-sm rounded-md border border-border hover:bg-secondary transition-colors"
                      >
                        Checkout
                      </button>
                    )}
                    {branch.name !== 'draft' && branch.name !== currentBranch && (
                      <button
                        onClick={() => handleDeleteBranch(branch.name)}
                        className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 新しいブランチの作成 */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Create new branch
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Branch name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBranch()}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleCreateBranch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </div>

          {/* ブランチのマージ */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
              Merge branch
            </h4>
            <div className="flex gap-2">
              <select
                value={mergeBranchName}
                onChange={(e) => setMergeBranchName(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select branch to merge...</option>
                {branches.filter(b => b.name !== currentBranch).map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleMergeBranch}
                disabled={!mergeBranchName}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Merge
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Merge selected branch into <span className="font-mono">{currentBranch}</span>
            </p>
          </div>
        </div>
      )}

      {/* Historyタブ */}
      {activeTab === 'history' && (
        <div>
          {versions.length > 0 ? (
            <CommitGraph versions={versions} onCheckout={handleCheckoutVersion} />
          ) : (
            <div className="text-sm text-muted-foreground">履歴がありません。コミットを作成してください。</div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionControl;