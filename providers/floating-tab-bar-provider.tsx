import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { floatingTabBarScrollDistance } from "@/constants/navigation";

interface FloatingTabBarContextValue {
  compactProgress: number;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const FloatingTabBarContext = createContext<FloatingTabBarContextValue | null>(
  null,
);
const bottomBounceThreshold = 18;

interface FloatingTabBarProviderProps {
  children: ReactNode;
}

const clampCompactProgress = (progress: number): number => {
  return Math.min(1, Math.max(0, progress));
};

export function FloatingTabBarProvider({
  children,
}: FloatingTabBarProviderProps) {
  const lastScrollY = useRef(0);
  const compactProgressRef = useRef(0);
  const [compactProgress, setCompactProgress] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const nextScrollY = Math.max(contentOffset.y, 0);
      const scrollDelta = nextScrollY - lastScrollY.current;
      const isAtBottom =
        nextScrollY + layoutMeasurement.height >=
        contentSize.height - bottomBounceThreshold;

      if (isAtBottom && scrollDelta < 0) {
        lastScrollY.current = nextScrollY;
        return;
      }

      const nextCompactProgress = clampCompactProgress(
        compactProgressRef.current + scrollDelta / floatingTabBarScrollDistance,
      );

      if (nextCompactProgress !== compactProgressRef.current) {
        compactProgressRef.current = nextCompactProgress;
        setCompactProgress(nextCompactProgress);
      }

      lastScrollY.current = nextScrollY;
    },
    [],
  );

  const value = useMemo(
    () => ({
      compactProgress,
      handleScroll,
    }),
    [compactProgress, handleScroll],
  );

  return (
    <FloatingTabBarContext.Provider value={value}>
      {children}
    </FloatingTabBarContext.Provider>
  );
}

export function useFloatingTabBar() {
  const context = useContext(FloatingTabBarContext);

  if (!context) {
    throw new Error(
      "useFloatingTabBar must be used inside FloatingTabBarProvider.",
    );
  }

  return context;
}
