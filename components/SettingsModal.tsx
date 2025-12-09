import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { Button } from "./ui/Button";
import { useAuth } from "../contexts/AuthContext";

// A simple check for the existence of the API key from environment variables.
// Replace the check for API key availability
const isAiAvailable = !!localStorage.getItem("apiKey");

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onOpenGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onOpenGuide,
}) => {
  const { theme, setTheme, language, setLanguage, t } = useSettings();
  const { isFirebaseAvailable } = useAuth();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleShowGuide = () => {
    onClose();
    onOpenGuide();
  };

  const handleOpenApiKeyModal = () => {
    setIsApiKeyModalOpen(true);
  };

  const handleCloseApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError("API Key cannot be empty.");
      return;
    }

    try {
      localStorage.setItem("apiKey", apiKey);
      alert("API Key saved successfully!");
      setApiKey(""); // Clear input after saving
      setError("");
    } catch (e) {
      setError("Failed to save API Key. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-2xl flex flex-col w-full max-w-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {t("settings", language)}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
            title={t("close", language)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Theme Settings */}
            <div className="space-y-2">
              <label className="text-md font-semibold text-foreground">
                {t("theme", language)}
              </label>
              <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    theme === "light"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary-hover"
                  }`}
                >
                  {t("light", language)}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    theme === "dark"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary-hover"
                  }`}
                >
                  {t("dark", language)}
                </button>
              </div>
            </div>

            {/* Language Settings */}
            <div className="space-y-2">
              <label
                htmlFor="language-select"
                className="text-md font-semibold text-foreground"
              >
                {t("language", language)}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "ja")}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            {/* User Guide */}
            <div className="space-y-2">
              <label className="text-md font-semibold text-foreground">
                {t("userGuide", language)}
              </label>
              <Button
                variant="secondary"
                onClick={handleShowGuide}
                className="w-full"
              >
                {t("showUserGuide", language)}
              </Button>
            </div>

            {/* Service Status */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-md font-semibold text-foreground">
                {t("serviceStatus", language)}
              </h3>
              {/* AI Settings */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("aiAssistant", language)}
                </p>
                {isAiAvailable ? (
                  <>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {t("featureEnabled", language)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {t("featureDisabled", language)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("aiDisabledHint", language)}
                    </p>
                    <Button
                      onClick={handleOpenApiKeyModal}
                      className="w-full"
                    >
                      {t("registerApiKey", language)}
                    </Button>
                  </>
                )}
              </div>
              {/* Sync Settings */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("cloudSync", language)}
                </p>
                {isFirebaseAvailable ? (
                  <>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {t("featureEnabled", language)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {t("featureDisabled", language)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("syncDisabledHint", language)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-2 pt-4 border-t border-border">
              <h3 className="text-md font-semibold text-danger">
                {t("dataManagement", language)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("resetWarning", language)}
              </p>
              <Button
                variant="danger"
                onClick={onResetData}
                className="w-full"
              >
                {t("resetAllData", language)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Registration Modal */}
      {isApiKeyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={handleCloseApiKeyModal}
        >
          <div
            className="bg-card rounded-lg shadow-2xl flex flex-col w-full max-w-md max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 flex-shrink-0 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">
                {t("apiKeyRegistration", language)}
              </h2>
              <button
                onClick={handleCloseApiKeyModal}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
                title={t("close", language)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <label htmlFor="api-key" className="block text-sm font-medium text-foreground">
                Enter your API Key
              </label>
              <input
                id="api-key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-ring focus:border-ring outline-none"
              />
              {error && <p className="mt-2 text-sm text-danger">{error}</p>}
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveApiKey} className="w-full">
                  Save API Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
