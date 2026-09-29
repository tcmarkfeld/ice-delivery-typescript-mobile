import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { Delivery } from "@/api/types";
import { Button, IconName } from "@/components/ui/button";
import { successHaptic } from "@/components/ui/haptics";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { AppTheme, Radius, ToneKey } from "@/constants/theme";
import { getDeliveryAddons } from "@/features/deliveries/addons";
import {
  getCoolerSizeLabel,
  getIceLoadLabel,
  getRentalDayLabel,
  getStopKind,
  StopKind,
  stopKindLabel,
  toCount,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";

interface StopCardProps {
  delivery: Delivery;
  dateKey: string;
  isCompleted?: boolean;
  /** Omit to render the card read-only, e.g. when planning ahead. */
  onToggleCompleted?: () => void;
}

const toneByStopKind: Record<StopKind, ToneKey> = {
  [StopKind.Dropoff]: ToneKey.Dropoff,
  [StopKind.Refill]: ToneKey.Refill,
  [StopKind.Pickup]: ToneKey.Pickup,
};

export const stopKindIcon: Record<StopKind, IconName> = {
  [StopKind.Dropoff]: "package-variant-closed",
  [StopKind.Refill]: "snowflake",
  [StopKind.Pickup]: "tray-arrow-up",
};

const openMaps = async (address: string): Promise<void> => {
  const destination = encodeURIComponent(`${address} Corolla, NC 27927`);
  const provider = Platform.OS === "ios" ? "apple" : "google";
  await Linking.openURL(`http://maps.${provider}.com/?daddr=${destination}`);
};

const textCustomerReviewRequest = async (
  name: string,
  phone: string,
): Promise<void> => {
  const firstName = name.split(" ")[0] ?? "there";
  const message = `Hey ${firstName}, this is Benicio with Corolla Ice Delivery. Just wanted to thank you for your business this past week and hope you enjoyed! If you would be willing to leave us a Google review we would really appreciate it!
  https://g.page/r/CUBe_7herDpHEAE/review`;

  await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
};

const hasInstructions = (delivery: Delivery): boolean => {
  const instructions = delivery.special_instructions.trim();
  return instructions.length > 0 && instructions.toLowerCase() !== "none";
};

export function StopCard({
  delivery,
  dateKey,
  isCompleted = false,
  onToggleCompleted,
}: StopCardProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const stopKind = getStopKind(delivery, dateKey);
  const tone =
    colors.tone[isCompleted ? ToneKey.Done : toneByStopKind[stopKind]];
  const coolerCount = toCount(delivery.cooler_num);
  const addons =
    stopKind === StopKind.Dropoff ? getDeliveryAddons(delivery) : [];
  const deliveryTime = [delivery.deliverytime, delivery.dayornight]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const renderChip = (icon: IconName, label: string, emphasis = false) => (
    <View
      style={[
        styles.chip,
        emphasis
          ? { backgroundColor: tone.background, borderColor: tone.background }
          : undefined,
      ]}
    >
      <MaterialCommunityIcons
        color={emphasis ? tone.foreground : colors.textMuted}
        name={icon}
        size={14}
      />
      <Text
        style={[
          styles.chipText,
          emphasis ? { color: tone.foreground } : undefined,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      style={[styles.card, isCompleted ? styles.completedCard : undefined]}
    >
      <View style={[styles.accentRail, { backgroundColor: tone.accent }]} />

      <View style={styles.headerRow}>
        <View style={styles.identity}>
          <View style={styles.metaLine}>
            <View
              style={[styles.kindBadge, { backgroundColor: tone.background }]}
            >
              <MaterialCommunityIcons
                color={tone.foreground}
                name={isCompleted ? "check" : stopKindIcon[stopKind]}
                size={12}
              />
              <Text style={[styles.kindBadgeText, { color: tone.foreground }]}>
                {isCompleted ? "Done" : stopKindLabel[stopKind]}
              </Text>
            </View>
            {!isCompleted ? (
              <Text numberOfLines={1} style={styles.dayText}>
                {stopKind === StopKind.Pickup
                  ? "Ended yesterday"
                  : getRentalDayLabel(delivery, dateKey)}
              </Text>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              isCompleted ? styles.completedText : undefined,
            ]}
          >
            {delivery.customer_name}
          </Text>
          <Text numberOfLines={1} style={styles.address}>
            {delivery.delivery_address}
          </Text>
        </View>
        {onToggleCompleted ? (
          <PressableScale
            accessibilityLabel={`Mark ${delivery.customer_name} ${isCompleted ? "not done" : "done"}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
            hitSlop={8}
            onPress={() => {
              if (!isCompleted) {
                successHaptic();
              }
              onToggleCompleted();
            }}
            pressedScale={0.86}
            style={[
              styles.checkButton,
              isCompleted
                ? { backgroundColor: tone.accent, borderColor: tone.accent }
                : undefined,
            ]}
          >
            <MaterialCommunityIcons
              color={isCompleted ? colors.surface : colors.textSubtle}
              name="check-bold"
              size={20}
            />
          </PressableScale>
        ) : null}
      </View>

      {!isCompleted ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.details}>
          <View style={styles.chipRow}>
            {stopKind === StopKind.Pickup
              ? renderChip(
                  "tray-arrow-up",
                  `Collect ${coolerCount} cooler${coolerCount === 1 ? "" : "s"}`,
                  true,
                )
              : renderChip("snowflake", getIceLoadLabel(delivery), true)}
            {stopKind === StopKind.Dropoff
              ? renderChip(
                  "package-variant-closed",
                  `Drop ${coolerCount > 1 ? `${coolerCount}× ` : ""}${getCoolerSizeLabel(delivery.cooler_size)}`,
                )
              : null}
            {stopKind === StopKind.Dropoff && deliveryTime
              ? renderChip("clock-outline", deliveryTime)
              : null}
            {addons.map((addon) => {
              const palette = colors.addon[addon.themeKey];

              return (
                <View
                  key={addon.label}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: palette.backgroundColor,
                      borderColor: palette.borderColor,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    color={palette.iconColor}
                    name={addon.icon}
                    size={14}
                  />
                  <Text style={[styles.chipText, { color: palette.textColor }]}>
                    {addon.count} {addon.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {hasInstructions(delivery) ? (
            <View
              style={[
                styles.note,
                { backgroundColor: colors.tone[ToneKey.Note].background },
              ]}
            >
              <MaterialCommunityIcons
                color={colors.tone[ToneKey.Note].accent}
                name="note-text-outline"
                size={16}
              />
              <Text
                style={[
                  styles.noteText,
                  { color: colors.tone[ToneKey.Note].foreground },
                ]}
              >
                {delivery.special_instructions}
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              accessibilityLabel={`Navigate to ${delivery.delivery_address}`}
              icon="navigation-variant"
              label="Navigate"
              onPress={() => openMaps(delivery.delivery_address)}
              size="sm"
              style={styles.navigateButton}
            />
            <IconButton
              accessibilityLabel={`Call ${delivery.customer_name}`}
              backgroundColor={colors.surfaceMuted}
              color={colors.primaryText}
              icon="phone"
              onPress={() => Linking.openURL(`tel:${delivery.customer_phone}`)}
              size={40}
            />
            <IconButton
              accessibilityLabel={`Text ${delivery.customer_name}`}
              backgroundColor={colors.surfaceMuted}
              color={colors.primaryText}
              icon="message-text"
              onPress={() => Linking.openURL(`sms:${delivery.customer_phone}`)}
              size={40}
            />
            {stopKind === StopKind.Pickup ? (
              <IconButton
                accessibilityLabel={`Ask ${delivery.customer_name} for a review`}
                backgroundColor={colors.tone[ToneKey.Dropoff].background}
                color={colors.tone[ToneKey.Dropoff].foreground}
                icon="star-outline"
                onPress={() =>
                  textCustomerReviewRequest(
                    delivery.customer_name,
                    delivery.customer_phone,
                  )
                }
                size={40}
              />
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: Radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 10,
      overflow: "hidden",
      paddingBottom: 12,
      paddingLeft: 18,
      paddingRight: 12,
      paddingTop: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: theme.scheme === "dark" ? 0 : 0.05,
      shadowRadius: 10,
    },
    completedCard: {
      backgroundColor: theme.colors.surfaceMuted,
      shadowOpacity: 0,
    },
    accentRail: {
      bottom: 0,
      left: 0,
      position: "absolute",
      top: 0,
      width: 5,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    identity: {
      flex: 1,
      gap: 1,
    },
    metaLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      marginBottom: 3,
    },
    kindBadge: {
      alignItems: "center",
      borderRadius: Radius.pill,
      flexDirection: "row",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    kindBadgeText: {
      fontSize: 12,
      fontWeight: "800",
    },
    dayText: {
      color: theme.colors.textSubtle,
      flexShrink: 1,
      fontSize: 12,
      fontWeight: "600",
    },
    checkButton: {
      alignItems: "center",
      borderColor: theme.colors.borderStrong,
      borderRadius: 22,
      borderWidth: 2,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    name: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    completedText: {
      color: theme.colors.textMuted,
    },
    address: {
      color: theme.colors.textMuted,
      fontSize: 15,
      fontWeight: "500",
    },
    details: {
      gap: 8,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    chip: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: Radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    chipText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    note: {
      alignItems: "flex-start",
      borderRadius: Radius.sm,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    noteText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 19,
    },
    actions: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
    },
    navigateButton: {
      flex: 1,
    },
  });
