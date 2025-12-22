/**
 * Server Context - Detects and provides server mode information
 * 
 * Fetches server info on mount and provides it to the app.
 * Used to adapt UI based on whether connected to ADMIN or USER server.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface ServerInfo {
    server_mode: 'ADMIN' | 'USER';
    server_name: string;
    features: {
        remember_me: boolean;
    };
}

interface ServerContextType {
    serverInfo: ServerInfo | null;
    isLoading: boolean;
    isAdminServer: boolean;
    isUserServer: boolean;
    error: string | null;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function ServerProvider({ children }: { children: ReactNode }) {
    const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServerInfo = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/server-info`, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch server info');
                }

                const data = await response.json();
                setServerInfo(data);
                setError(null);

                // Set data attribute on document for CSS theming
                document.documentElement.setAttribute('data-server-mode', data.server_mode);
            } catch (err) {
                console.error('Failed to fetch server info:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                // Default to USER mode if server info fetch fails
                setServerInfo({
                    server_mode: 'USER',
                    server_name: 'Attendance System',
                    features: { remember_me: true }
                });
                document.documentElement.setAttribute('data-server-mode', 'USER');
            } finally {
                setIsLoading(false);
            }
        };

        fetchServerInfo();
    }, []);

    const isAdminServer = serverInfo?.server_mode === 'ADMIN';
    const isUserServer = serverInfo?.server_mode === 'USER';

    return (
        <ServerContext.Provider
            value={{
                serverInfo,
                isLoading,
                isAdminServer,
                isUserServer,
                error,
            }}
        >
            {children}
        </ServerContext.Provider>
    );
}

export function useServer() {
    const context = useContext(ServerContext);
    if (context === undefined) {
        throw new Error('useServer must be used within a ServerProvider');
    }
    return context;
}

/**
 * Hook to check if a feature is enabled based on server mode
 */
export function useServerFeature(feature: keyof ServerInfo['features']): boolean {
    const { serverInfo } = useServer();
    return serverInfo?.features[feature] ?? false;
}
