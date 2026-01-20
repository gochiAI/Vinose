import React, { useState } from "react";
import {
  Bell,
  Play,
  PenTool,
  Users,
  Upload,
  FolderPlus,
  FileText,
  Table,
} from "lucide-react";
import { ViewState } from "../../App";
import { HeaderInfo } from "../../types";

interface TopBarProps {
  view: ViewState;
  headerInfo?: HeaderInfo;
  onAction: (action: string) => void;
  onNavigate?: (view: ViewState) => void;
}

export const TopBar = ({
  view,
  headerInfo,
  onAction,
  onNavigate,
}: TopBarProps) => {
  // Static Views (Dashboard, etc.)
  if (
    view === "dashboard" ||
    view === "characters" ||
    view === "assets" ||
    view === "documents" ||
    view === "settings"
  ) {
    let title = "Overview";
    let subtext = "";

    if (view === "dashboard") {
      title = "Overview";
      subtext = "Last synced 2 minutes ago";
    } else if (view === "characters") {
      title = "Characters";
      subtext = "Manage cast profiles and relationships";
    } else if (view === "assets") {
      title = "Asset Library";
      subtext = "Manage game resources, images, and audio";
    } else if (view === "documents") {
      title = "Documents";
      subtext = "Planning, Scripts, and Data Management";
    } else if (view === "settings") {
      title = "Project Settings";
      subtext = "Configuration and Preferences";
    }

    return (
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-8 py-4 flex flex-wrap items-center justify-between gap-4 h-auto min-h-[56px]">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {view === "dashboard" ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
              {subtext}
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtext}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Bell size={20} />
          </button>
          {view !== "settings" && (
            <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
          )}

          {view === "characters" && (
            <button
              onClick={() => onAction("ADD_CHARACTER")}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-surface-dark border border-gray-700 hover:bg-white/5 text-white text-sm font-bold transition-all active:scale-95"
            >
              <Users size={18} />
              <span>Add Character</span>
            </button>
          )}

          {view === "assets" && (
            <button
              onClick={() => onAction("UPLOAD_ASSET")}
              className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Upload size={18} />
              <span>Upload Assets</span>
            </button>
          )}

          {view === "documents" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAction("NEW_FOLDER")}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-surface-dark border border-gray-700 hover:bg-white/5 text-white text-sm font-bold transition-all active:scale-95"
                title="New Folder"
              >
                <FolderPlus size={18} />
                <span className="hidden sm:inline">Folder</span>
              </button>
              <button
                onClick={() => onAction("NEW_DOC")}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-900/30 border border-blue-500/30 hover:bg-blue-900/50 text-blue-300 text-sm font-bold transition-all active:scale-95"
                title="New Google Doc"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">Doc</span>
              </button>
              <button
                onClick={() => onAction("NEW_SHEET")}
                className="flex items-center gap-2 h-10 px-4 rounded-lg bg-green-900/30 border border-green-500/30 hover:bg-green-900/50 text-green-300 text-sm font-bold transition-all active:scale-95"
                title="New Google Sheet"
              >
                <Table size={18} />
                <span className="hidden sm:inline">Sheet</span>
              </button>
            </div>
          )}

          {view === "dashboard" && (
            <>
              <button
                onClick={() => onAction("TEST_BUILD")}
                className="flex items-center gap-2 h-10 px-6 rounded-lg bg-secondary hover:bg-[#a67d42] text-white text-sm font-bold shadow-lg shadow-secondary/10 transition-all active:scale-95"
              >
                <Play size={18} fill="currentColor" />
                <span>Test Build</span>
              </button>
              <button
                onClick={() => onAction("CONTINUE_EDITING")}
                className="flex items-center gap-2 h-10 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <PenTool size={18} />
                <span>Continue Editing</span>
              </button>
            </>
          )}
        </div>
      </header>
    );
  }

  // Story Editing Views (ChapterList, Chapter, Editor)
  return (
    <header className="h-14 border-b border-border-dark flex items-center justify-between px-6 bg-surface-darker shrink-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span
            className="hover:text-white cursor-pointer transition-colors"
            onClick={() => onNavigate && onNavigate("chapterList")}
          >
            {headerInfo?.title || "Project"}
          </span>

          {(view === "chapter" || view === "editor") && (
            <>
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
              <span
                className="hover:text-white cursor-pointer transition-colors"
                onClick={() => onNavigate && onNavigate("chapter")}
              >
                {headerInfo?.chapter || "Chapter"}
              </span>
            </>
          )}

          {view === "editor" && (
            <>
              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>
              <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded">
                {headerInfo?.scene || "Scene"}
              </span>
            </>
          )}
        </div>
        <div className="w-px h-4 bg-gray-700 mx-2"></div>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Auto-saved
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[18px]">history</span>
        </button>
        <button
          onClick={() => onAction("EXPORT_SCRIPT")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-gray-700"
        >
          <span className="material-symbols-outlined text-[18px]">
            download
          </span>
          Export Script
        </button>
        {view === "editor" && (
          <button
            onClick={() => onAction("PLAYTEST_SCENE")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] fill">
              play_arrow
            </span>
            Playtest Scene
          </button>
        )}
      </div>
    </header>
  );
};
