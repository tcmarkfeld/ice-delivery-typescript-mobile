import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import "react-native-reanimated";

import { SessionProvider } from "@/auth/session-provider";
import { AppThemes } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import {
  AppThemeProvider,
  themeModeTransitionDurationMs,
  useThemeMode,
} from "@/providers/app-theme-provider";
import { QueryProvider } from "@/providers/query-provider";

function RootNavigator() {
  const { authToken, isHydratingSession } = useSession();

  if (isHydratingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!authToken) {
    return (
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}

function ThemedRootLayout() {
  const appTheme = useAppTheme();
  const navigationTheme = appTheme.scheme === "dark" ? DarkTheme : DefaultTheme;
  const statusBarStyle = appTheme.scheme === "dark" ? "light" : "dark";

  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider value={navigationTheme}>
          <RootNavigator />
          <ThemeModeTransitionOverlay />
          <StatusBar style={statusBarStyle} />
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}

function ThemeModeTransitionOverlay() {
  const { themeModeTransition } = useThemeMode();
  const { height, width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!themeModeTransition) {
      progress.setValue(0);
      return;
    }

    progress.setValue(0);
    Animated.timing(progress, {
      duration: themeModeTransitionDurationMs,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [progress, themeModeTransition]);

  if (!themeModeTransition) {
    return null;
  }

  const circleSize = Math.hypot(width, height) * 2;
  const originX = width * 0.86;
  const originY = height * 0.12;
  const backgroundColor =
    AppThemes[themeModeTransition.nextThemeMode].colors.screen;
  const opacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.24, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 1],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.themeTransitionCircle,
          {
            backgroundColor,
            height: circleSize,
            left: originX - circleSize / 2,
            opacity,
            top: originY - circleSize / 2,
            transform: [{ scale }],
            width: circleSize,
          },
        ]}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedRootLayout />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  themeTransitionCircle: {
    borderRadius: 9999,
    position: "absolute",
  },
});
