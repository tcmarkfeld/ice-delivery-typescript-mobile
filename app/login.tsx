import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLoginMutation } from '@/api/queries/use-auth-mutation';
import { resolveAuthToken, resolveLoginFailureMessage } from '@/auth/resolve-auth-token';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/hooks/use-session';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const { setAuthToken } = useSession();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

  const screenStyle = useMemo(
    () => (isDarkMode ? styles.darkScreen : styles.lightScreen),
    [isDarkMode]
  );
  const panelStyle = useMemo(() => (isDarkMode ? styles.darkPanel : styles.lightPanel), [isDarkMode]);
  const titleStyle = useMemo(() => (isDarkMode ? styles.darkTitle : styles.lightTitle), [isDarkMode]);

  const handleLogin = async () => {
    setLoginError(null);

    try {
      const loginResponse = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      const token = resolveAuthToken(loginResponse);

      if (!token) {
        const loginFailureMessage = resolveLoginFailureMessage(loginResponse);
        setLoginError(loginFailureMessage ?? 'Login failed. Please check your username/password.');
        return;
      }

      await setAuthToken(token);
      setPassword('');
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setLoginError(errorMessage);
    }
  };

  return (
    <View style={[styles.screen, screenStyle]}>
      <View style={[styles.panel, panelStyle]}>
        <Text style={[styles.title, titleStyle]}>Sign in</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={isDarkMode ? '#8f9ba8' : '#738191'}
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={isDarkMode ? '#8f9ba8' : '#738191'}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
        <Pressable
          disabled={loginMutation.isPending || !email.trim() || !password}
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.primaryButton,
            (loginMutation.isPending || !email.trim() || !password) && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}>
          <Text style={styles.primaryButtonText}>{loginMutation.isPending ? 'Signing in...' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  lightScreen: {
    backgroundColor: '#f4f7fb',
  },
  darkScreen: {
    backgroundColor: '#111827',
  },
  panel: {
    borderRadius: 12,
    padding: 16,
  },
  lightPanel: {
    backgroundColor: '#ffffff',
  },
  darkPanel: {
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  lightTitle: {
    color: '#0f172a',
  },
  darkTitle: {
    color: '#f8fafc',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d2dae4',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 11,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 2,
  },
});
