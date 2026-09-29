import Constants from "expo-constants";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button, ButtonVariant } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { AppColorScheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useThemeMode } from "@/providers/app-theme-provider";

interface AccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSheet({ visible, onClose }: AccountSheetProps) {
  const theme = useAppTheme();
  const { themeMode, toggleThemeMode } = useThemeMode();
  const { clearAuthToken } = useSession();

  return (
    <Sheet
      onClose={onClose}
      subtitle="Corolla Ice Delivery"
      title="Settings"
      visible={visible}
    >
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textSubtle }]}>
          Appearance
        </Text>
        <SegmentedControl<AppColorScheme>
          accessibilityLabel="Appearance"
          onChange={(nextThemeMode) => {
            if (nextThemeMode !== themeMode) {
              toggleThemeMode();
            }
          }}
          options={[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ]}
          value={themeMode}
        />
      </View>
      <Button
        icon="logout"
        label="Sign out"
        onPress={async () => {
          onClose();
          await clearAuthToken();
          router.replace("/login");
        }}
        variant={ButtonVariant.Danger}
      />
      <Text style={[styles.version, { color: theme.colors.textSubtle }]}>
        Version {Constants.expoConfig?.version ?? "—"}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  version: {
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
  },
});
