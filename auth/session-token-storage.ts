import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export enum SessionStorageKey {
  AuthToken = "ice_delivery_auth_token",
}

let inMemoryAuthToken: string | null = null;

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

export const getStoredAuthToken = async (): Promise<string | null> => {
  if (canUseLocalStorage()) {
    const value = window.localStorage.getItem(SessionStorageKey.AuthToken);
    return value;
  }

  if (isNativePlatform()) {
    const storedToken = await SecureStore.getItemAsync(
      SessionStorageKey.AuthToken,
    );
    return storedToken;
  }

  return inMemoryAuthToken;
};

export const setStoredAuthToken = async (token: string): Promise<void> => {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(SessionStorageKey.AuthToken, token);
    return;
  }

  if (isNativePlatform()) {
    await SecureStore.setItemAsync(SessionStorageKey.AuthToken, token);
    return;
  }

  inMemoryAuthToken = token;
};

export const clearStoredAuthToken = async (): Promise<void> => {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(SessionStorageKey.AuthToken);
    return;
  }

  if (isNativePlatform()) {
    await SecureStore.deleteItemAsync(SessionStorageKey.AuthToken);
    return;
  }

  inMemoryAuthToken = null;
};
