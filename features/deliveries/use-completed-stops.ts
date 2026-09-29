import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { addDaysToDateKey } from "@/features/date/date-key-utils";

const storageKeyPrefix = "ice_delivery_completed_stops_";

const readCompletedIds = async (storageKey: string): Promise<string[]> => {
  const value =
    Platform.OS === "web"
      ? globalThis.localStorage?.getItem(storageKey)
      : await SecureStore.getItemAsync(storageKey);

  try {
    const parsedValue: unknown = JSON.parse(value ?? "[]");
    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch {
    return [];
  }
};

const writeCompletedIds = async (storageKey: string, ids: string[]) => {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(ids));
    return;
  }

  await SecureStore.setItemAsync(storageKey, JSON.stringify(ids));
};

/**
 * Tracks which stops the driver has finished on a given route day. Saved on
 * device so progress survives the app being closed mid-route.
 */
export function useCompletedStops(dateKey: string) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const storageKey = `${storageKeyPrefix}${dateKey}`;

  useEffect(() => {
    let isMounted = true;

    void readCompletedIds(storageKey).then((ids) => {
      if (isMounted) {
        setCompletedIds(new Set(ids));
      }
    });

    if (Platform.OS !== "web") {
      void SecureStore.deleteItemAsync(
        `${storageKeyPrefix}${addDaysToDateKey(dateKey, -1)}`,
      );
    }

    return () => {
      isMounted = false;
    };
  }, [dateKey, storageKey]);

  const toggleCompleted = (id: string) => {
    const nextIds = new Set(completedIds);

    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }

    setCompletedIds(nextIds);
    void writeCompletedIds(storageKey, [...nextIds]);
  };

  return { completedIds, toggleCompleted };
}
