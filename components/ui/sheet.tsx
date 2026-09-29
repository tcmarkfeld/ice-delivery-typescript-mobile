import { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/components/ui/icon-button";
import { Radius, TypeScale } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: SheetProps) {
  const theme = useAppTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.container}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <Animated.View
          entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceRaised,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: colors.borderStrong }]}
          />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text
                accessibilityRole="header"
                style={[TypeScale.title, { color: colors.text }]}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <IconButton
              accessibilityLabel="Close"
              backgroundColor={colors.surfaceMuted}
              color={colors.textMuted}
              icon="close"
              onPress={onClose}
              size={36}
            />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 3,
    height: 5,
    marginBottom: 12,
    width: 40,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
