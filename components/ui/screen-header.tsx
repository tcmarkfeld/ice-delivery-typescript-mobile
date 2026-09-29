import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconName } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TypeScale } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface ScreenHeaderProps {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  backIcon?: IconName;
  actions?: ReactNode;
  /** Defaults to the device safe-area inset; sheets pass their own. */
  topInset?: number;
}

export function ScreenHeader({
  title,
  eyebrow,
  onBack,
  backIcon = "chevron-left",
  actions,
  topInset,
}: ScreenHeaderProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: (topInset ?? insets.top) + 6 }]}>
      {onBack ? (
        <IconButton
          accessibilityLabel="Back"
          icon={backIcon}
          onPress={onBack}
        />
      ) : null}
      <View style={styles.titleColumn}>
        {eyebrow ? (
          <Text
            numberOfLines={1}
            style={[TypeScale.eyebrow, { color: theme.colors.primaryText }]}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          accessibilityRole="header"
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          numberOfLines={1}
          style={[TypeScale.largeTitle, { color: theme.colors.text }]}
        >
          {title}
        </Text>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  titleColumn: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
