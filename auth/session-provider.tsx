import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import {
  clearStoredAuthToken,
  getStoredAuthToken,
  setStoredAuthToken,
} from '@/auth/session-token-storage';

export interface SessionContextValue {
  authToken: string | null;
  isHydratingSession: boolean;
  setAuthToken: (token: string) => Promise<void>;
  clearAuthToken: () => Promise<void>;
}

const defaultContextValue: SessionContextValue = {
  authToken: null,
  isHydratingSession: true,
  setAuthToken: async () => {},
  clearAuthToken: async () => {},
};

export const SessionContext = createContext<SessionContextValue>(defaultContextValue);

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [authToken, setAuthTokenState] = useState<string | null>(null);
  const [isHydratingSession, setIsHydratingSession] = useState<boolean>(true);

  useEffect(() => {
    const hydrateSession = async () => {
      const storedToken = await getStoredAuthToken();
      setAuthTokenState(storedToken);
      setIsHydratingSession(false);
    };

    hydrateSession();
  }, []);

  const setAuthToken = useCallback(async (token: string) => {
    await setStoredAuthToken(token);
    setAuthTokenState(token);
  }, []);

  const clearAuthToken = useCallback(async () => {
    setAuthTokenState(null);
    await clearStoredAuthToken();
  }, []);

  const contextValue = useMemo(
    () => ({
      authToken,
      isHydratingSession,
      setAuthToken,
      clearAuthToken,
    }),
    [authToken, clearAuthToken, isHydratingSession, setAuthToken]
  );

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};
