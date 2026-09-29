import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button, ButtonVariant, IconName } from "@/components/ui/button";
import { Radius, TypeScale } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export function LoadingState() {
  const theme = useAppTheme();

  return (
    <View style={styles.centered}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.centered}>
      <EmptyState
        action={
          <Button
            icon="refresh"
            label="Try again"
            onPress={onRetry}
            variant={ButtonVariant.Secondary}
          />
        }
        body={message}
        icon="wifi-alert"
        title="Couldn't load deliveries"
      />
    </View>
  );
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}
      >
        <MaterialCommunityIcons
          color={colors.primaryText}
          name={icon}
          size={30}
        />
      </View>
      <Text style={[TypeScale.headline, styles.center, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.body, { color: colors.textSubtle }]}>{body}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  empty: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: Radius.lg,
    height: 64,
    justifyContent: "center",
    marginBottom: 8,
    width: 64,
  },
  center: {
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 300,
    textAlign: "center",
  },
  action: {
    marginTop: 14,
  },
});
