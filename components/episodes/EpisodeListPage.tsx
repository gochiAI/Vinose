import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  Users,
} from "lucide-react";
import { useDatabase } from "../../contexts/DatabaseContext";
import { Chapter, Episode, ExtendedCharacter, SceneNode } from "../../types";
import { Modal } from "../common/Modal";
import { Input, Label, TextArea, Select } from "../common/Form";
import { ConfirmDialog } from "../common/ConfirmDialog";

export const EpisodeListPage = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const db = useDatabase();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCharacters, setAllCharacters] = useState<ExtendedCharacter[]>([]);

  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState<Partial<Episode>>({});
  const [charSearch, setCharSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!chapterId) return;
      setLoading(true);
      try {
        const [chapterData, episodesData, charactersData] = await Promise.all([
          db.getChapter(chapterId),
          db.getEpisodes(chapterId),
          db.getCharacters(),
        ]);
        setChapter(chapterData);
        setEpisodes(episodesData.sort((a, b) => a.orderIndex - b.orderIndex));
        setAllCharacters(charactersData);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [db, chapterId]);

  const handleEditOpen = (episode: Episode) => {
    setEditingEpisode(episode);
    setEditForm({ ...episode });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEpisode || !editForm.title?.trim()) return;
    setSaving(true);
    const updated = {
      ...editingEpisode,
      ...editForm,
      updatedAt: new Date().toISOString(),
    } as Episode;
    try {
      await db.updateEpisode(updated.id, updated);
      setEpisodes((prev) =>
        prev.map((ep) => (ep.id === updated.id ? updated : ep)),
      );
      setIsEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEpisode) return;
    try {
      await db.deleteEpisode(editingEpisode.id);
      setEpisodes((prev) => prev.filter((ep) => ep.id !== editingEpisode.id));
      setShowDeleteConfirm(false);
      setIsEditModalOpen(false);
    } catch (e) {
      alert("Failed to delete");
    }
  };

  const toggleChar = (id: string) => {
    const current = editForm.characters || [];
    setEditForm({
      ...editForm,
      characters: current.includes(id)
        ? current.filter((c) => c !== id)
        : [...current, id],
    });
  };

  // 表示用：キャラクター名とアイコンの解決
  const renderCharAvatars = (charIds: string[]) => {
    return (
      <div className="flex -space-x-2 overflow-hidden">
        {charIds.slice(0, 4).map((id) => {
          const char = allCharacters.find((c) => c.id === id);
          return (
            <div
              key={id}
              className="inline-block size-6 rounded-full ring-2 ring-white dark:ring-surface-dark bg-gray-700 bg-cover"
              style={{
                backgroundImage: char?.avatarUrl
                  ? `url(${char.avatarUrl})`
                  : undefined,
              }}
              title={char?.name}
            />
          );
        })}
        {charIds.length > 4 && (
          <div className="flex items-center justify-center size-6 rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-bold ring-2 ring-white dark:ring-surface-dark">
            +{charIds.length - 4}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-y-auto p-8">
      {/* Header section... */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/chapters")}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">
            {chapter?.title || "Loading..."}
          </h1>
          <p className="text-gray-500">{episodes.length} Episodes</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold"
        >
          <Plus size={18} /> Add Episode
        </button>
      </div>

      {/* Episodes Table */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                #
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                Title
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                Cast
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                Timeframe
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {episodes.map((ep) => (
              <tr
                key={ep.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 text-sm text-gray-400">
                  #{ep.episodeNumber}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold">{ep.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                    {ep.description}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {renderCharAvatars(ep.characters || [])}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {ep.timeframe || "-"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEditOpen(ep)}
                      className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/editor/${chapterId}/${ep.id}`)}
                      className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/20 text-purple-600 rounded-lg transition-colors"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Episode Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Episode"
      >
        <div className="space-y-4">
          <div>
            <Label>Episode Title</Label>
            <Input
              value={newEpisodeTitle}
              onChange={(e) => setNewEpisodeTitle(e.target.value)}
              placeholder="Enter episode title"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!newEpisodeTitle.trim() || !chapterId) return;
                setSaving(true);
                try {
                  const now = new Date().toISOString();
                  const newEpisodeId = `ep_${Date.now()}`;
                  
                  const newEpisode: Episode = {
                    id: newEpisodeId,
                    chapterId,
                    title: newEpisodeTitle,
                    episodeNumber: episodes.length + 1,
                    orderIndex: episodes.length,
                    description: "",
                    characters: [],
                    status: "draft",
                    createdAt: now,
                    updatedAt: now,
                  };
                  await db.createEpisode(newEpisode);
                  
                  // 始点ノードの作成
                  const startNode = {
                    id: `${newEpisodeId}_start`,
                    title: "Start Scene",
                    type: "start" as const,
                    chapterId,
                    episodeId: newEpisodeId,
                    summary: "Opening of the episode",
                    script: [],
                    nextIds: [],
                    createdAt: now,
                    updatedAt: now,
                  };
                  await db.saveSceneNode(startNode);
                  
                  setEpisodes((prev) => [...prev, newEpisode]);
                  setNewEpisodeTitle("");
                  setIsAddModalOpen(false);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={!newEpisodeTitle.trim() || saving}
              className="px-6 py-2 bg-primary text-white font-bold rounded-lg disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Episode"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal (using common Modal) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Episode Details"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value as any })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <TextArea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={2}
            />
          </div>

          <div>
            <Label>Participating Characters</Label>
            <div className="mt-2 p-3 bg-background-dark rounded-lg border border-gray-700 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
              {allCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => toggleChar(char.id)}
                  className={`flex items-center gap-2 p-2 rounded transition-colors text-sm ${editForm.characters?.includes(char.id) ? "bg-primary/20 text-primary border border-primary/50" : "bg-surface-dark border border-transparent hover:bg-white/5"}`}
                >
                  <div
                    className="size-5 rounded-full bg-cover"
                    style={{ backgroundImage: `url(${char.avatarUrl})` }}
                  />
                  {char.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-700">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold px-2"
            >
              <Trash2 size={16} /> Delete
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Episode"
        message={`Are you sure you want to delete "${editingEpisode?.title}"?`}
        description="This will permanently delete this episode and its script data."
        variant="danger"
      />
    </div>
  );
};
