import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackendStatus {
  connected: boolean;
  message: string;
}

const BackendStatusContext = createContext<BackendStatus>({
  connected: false,
  message: '',
});

export const useBackendStatus = () => useContext(BackendStatusContext);

export const BackendStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<BackendStatus>({
    connected: false,
    message: 'チェック中...',
  });

  useEffect(() => {
    const checkBackendConnection = async () => {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const useSqlite = process.env.REACT_APP_USE_SQLITE !== 'false';

      if (!useSqlite) {
        setStatus({ connected: true, message: 'ローカルストレージを使用中' });
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          timeout: 5000,
        });

        if (response.ok) {
          setStatus({ connected: true, message: 'バックエンド接続OK' });
        } else {
          setStatus({
            connected: false,
            message: `バックエンド接続エラー (${response.status})`,
          });
        }
      } catch (error) {
        setStatus({
          connected: false,
          message: `バックエンドに接続できません: ${backendUrl}`,
        });
      }
    };

    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <BackendStatusContext.Provider value={status}>
      {children}
      {!status.connected && process.env.REACT_APP_USE_SQLITE === 'true' && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p className="font-bold">⚠️ データベース接続エラー</p>
          <p className="text-sm">{status.message}</p>
        </div>
      )}
    </BackendStatusContext.Provider>
  );
};
