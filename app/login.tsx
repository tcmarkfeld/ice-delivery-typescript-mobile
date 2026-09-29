import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useLoginMutation } from "@/api/queries/use-auth-mutation";
import {
  resolveAuthToken,
  resolveLoginFailureMessage,
} from "@/auth/resolve-auth-token";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { AppTheme, Radius, TypeScale } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";

const lightIcon = require("@/assets/images/ice-delivery-light-mode-icon.png");
const darkIcon = require("@/assets/images/ice-delivery-dark-mode-icon.png");

export default function LoginScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const { setAuthToken } = useSession();
  const passwordInputRef = useRef<TextInput>(null);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();
  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit || loginMutation.isPending) {
      return;
    }

    setLoginError(null);

    try {
      const loginResponse = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      const token = resolveAuthToken(loginResponse);

      if (!token) {
        const loginFailureMessage = resolveLoginFailureMessage(loginResponse);
        setLoginError(
          loginFailureMessage ??
            "Login failed. Please check your username/password.",
        );
        return;
      }

      await setAuthToken(token);
      setPassword("");
      router.replace("/(tabs)");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setLoginError(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.brand}>
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={theme.scheme === "dark" ? darkIcon : lightIcon}
          style={styles.logo}
        />
        <Text accessibilityRole="header" style={styles.title}>
          Corolla Ice Delivery
        </Text>
        <Text style={styles.subtitle}>Sign in to run today&apos;s route.</Text>
      </View>

      <View style={styles.form}>
        <TextField
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          icon="email-outline"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          placeholder="you@corollaice.com"
          returnKeyType="next"
          submitBehavior="submit"
          textContentType="username"
          value={email}
        />
        <View>
          <TextField
            autoCapitalize="none"
            autoComplete="current-password"
            icon="lock-outline"
            inputStyle={styles.passwordInput}
            label="Password"
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            placeholder="Password"
            ref={passwordInputRef}
            returnKeyType="go"
            secureTextEntry={!isPasswordVisible}
            textContentType="password"
            value={password}
          />
          <Pressable
            accessibilityLabel={
              isPasswordVisible ? "Hide password" : "Show password"
            }
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={styles.visibilityToggle}
          >
            <MaterialCommunityIcons
              color={colors.textSubtle}
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
            />
          </Pressable>
        </View>

        {loginError ? (
          <View accessibilityLiveRegion="polite" style={styles.errorBanner}>
            <MaterialCommunityIcons
              color={colors.danger}
              name="alert-circle"
              size={20}
            />
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        ) : null}

        <Button
          disabled={!canSubmit}
          label="Sign in"
          loading={loginMutation.isPending}
          onPress={handleLogin}
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    brand: {
      alignItems: "center",
      marginBottom: 32,
    },
    logo: {
      borderRadius: Radius.xl,
      height: 96,
      marginBottom: 20,
      width: 96,
    },
    title: {
      ...TypeScale.title,
      color: theme.colors.text,
      fontSize: 26,
    },
    subtitle: {
      color: theme.colors.textSubtle,
      fontSize: 16,
      marginTop: 6,
    },
    form: {
      gap: 16,
    },
    passwordInput: {
      paddingRight: 32,
    },
    visibilityToggle: {
      bottom: 15,
      position: "absolute",
      right: 14,
    },
    errorBanner: {
      alignItems: "center",
      backgroundColor: theme.colors.dangerMuted,
      borderRadius: Radius.md,
      flexDirection: "row",
      gap: 8,
      padding: 14,
    },
    errorText: {
      color: theme.colors.danger,
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
    },
  });
