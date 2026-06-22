import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLoginMutation } from '@/api/queries/use-auth-mutation';
import { resolveAuthToken, resolveLoginFailureMessage } from '@/auth/resolve-auth-token';
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useSession } from '@/hooks/use-session';

export default function LoginScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { setAuthToken } = useSession();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

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
    <View style={styles.screen}>
      <View style={styles.panel}>
        <Text style={styles.title}>Sign in</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSubtle}
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.screen,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: theme.colors.text,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.iconOnPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    marginTop: 2,
  },
});
