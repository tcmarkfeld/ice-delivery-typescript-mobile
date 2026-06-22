import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { SessionProvider } from '@/auth/session-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useSession } from '@/hooks/use-session';
import { AppThemeProvider } from '@/providers/app-theme-provider';
import { QueryProvider } from '@/providers/query-provider';

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
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

function ThemedRootLayout() {
  const appTheme = useAppTheme();
  const navigationTheme = appTheme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const statusBarStyle = appTheme.scheme === 'dark' ? 'light' : 'dark';

  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider value={navigationTheme}>
          <RootNavigator />
          <StatusBar style={statusBarStyle} />
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
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
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
