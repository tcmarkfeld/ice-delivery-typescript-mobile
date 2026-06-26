import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { AppColorScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const themeModeTransitionDurationMs = 620;

interface ThemeModeTransition {
  key: number;
  nextThemeMode: AppColorScheme;
}

interface AppThemeModeContextValue {
  themeMode: AppColorScheme;
  themeModeTransition: ThemeModeTransition | null;
  toggleThemeMode: () => void;
}

const AppThemeModeContext = createContext<AppThemeModeContextValue | null>(
  null,
);
const themeModeStorageKey = "ice_delivery_theme_mode";
let inMemoryThemeMode: AppColorScheme | null = null;

interface AppThemeProviderProps {
  children: ReactNode;
}

const canUseLocalStorage = (): boolean => {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !!window.localStorage
  );
};

const isNativePlatform = (): boolean => {
  return Platform.OS === "ios" || Platform.OS === "android";
};

const isAppColorScheme = (value: string | null): value is AppColorScheme => {
  return value === "light" || value === "dark";
};

const getStoredThemeMode = async (): Promise<AppColorScheme | null> => {
  if (canUseLocalStorage()) {
    const value = window.localStorage.getItem(themeModeStorageKey);
    return isAppColorScheme(value) ? value : null;
  }

  if (isNativePlatform()) {
    const value = await SecureStore.getItemAsync(themeModeStorageKey);
    return isAppColorScheme(value) ? value : null;
  }

  return inMemoryThemeMode;
};

const setStoredThemeMode = async (themeMode: AppColorScheme): Promise<void> => {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(themeModeStorageKey, themeMode);
    return;
  }

  if (isNativePlatform()) {
    await SecureStore.setItemAsync(themeModeStorageKey, themeMode);
    return;
  }

  inMemoryThemeMode = themeMode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState<AppColorScheme | null>(
    null,
  );
  const [themeModeTransition, setThemeModeTransition] =
    useState<ThemeModeTransition | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const themeMode = themeOverride ?? systemColorScheme;

  const commitThemeMode = useCallback((nextThemeMode: AppColorScheme) => {
    setThemeOverride(nextThemeMode);
    void setStoredThemeMode(nextThemeMode);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStoredThemeMode = async () => {
      const storedThemeMode = await getStoredThemeMode();

      if (isMounted && storedThemeMode) {
        setThemeOverride(storedThemeMode);
      }
    };

    void loadStoredThemeMode();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<AppThemeModeContextValue>(() => {
    return {
      themeMode,
      themeModeTransition,
      toggleThemeMode: () => {
        const nextThemeMode = themeMode === "dark" ? "light" : "dark";

        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }

        setThemeModeTransition((currentTransition) => ({
          key: (currentTransition?.key ?? 0) + 1,
          nextThemeMode,
        }));

        commitThemeMode(nextThemeMode);

        transitionTimeoutRef.current = setTimeout(() => {
          setThemeModeTransition(null);
          transitionTimeoutRef.current = null;
        }, themeModeTransitionDurationMs);
      },
    };
  }, [commitThemeMode, themeMode, themeModeTransition]);

  return (
    <AppThemeModeContext.Provider value={value}>
      {children}
    </AppThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(AppThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used inside AppThemeProvider.");
  }

  return context;
}
