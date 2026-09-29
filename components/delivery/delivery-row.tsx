import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Delivery } from "@/api/types";
import { IconName } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { AppTheme, Radius, ToneKey } from "@/constants/theme";
import {
  currencyFormatter,
  formatShortDate,
  getIceLoadLabel,
  getNeighborhoodLabel,
  getRentalStatus,
  RentalStatus,
  toAmount,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";

interface DeliveryRowProps {
  delivery: Delivery;
  todayDateKey: string;
  onPress: () => void;
  onDelete: () => void;
}

const toneByStatus: Record<RentalStatus, ToneKey | null> = {
  [RentalStatus.Upcoming]: ToneKey.Refill,
  [RentalStatus.Active]: ToneKey.Done,
  [RentalStatus.Pickup]: ToneKey.Pickup,
  [RentalStatus.Finished]: null,
};

export function DeliveryRow({
  delivery,
  todayDateKey,
  onPress,
  onDelete,
}: DeliveryRowProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const status = getRentalStatus(delivery, todayDateKey);
  const statusTone = toneByStatus[status];
  const statusColors = statusTone
    ? colors.tone[statusTone]
    : { background: colors.surfaceMuted, foreground: colors.textSubtle };
  const tip = toAmount(delivery.tip);

  const renderMeta = (icon: IconName, label: string, color?: string) => (
    <View style={styles.meta}>
      <MaterialCommunityIcons
        color={color ?? colors.textSubtle}
        name={icon}
        size={15}
      />
      <Text style={[styles.metaText, color ? { color } : undefined]}>
        {label}
      </Text>
    </View>
  );

  return (
    <PressableScale
      accessibilityHint="Opens the delivery to edit"
      accessibilityLabel={`${delivery.customer_name}, ${delivery.delivery_address}, ${status}`}
      accessibilityRole="button"
      onPress={onPress}
      pressedScale={0.985}
      style={styles.card}
    >
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={styles.name}>
          {delivery.customer_name}
        </Text>
        <View
          style={[styles.status, { backgroundColor: statusColors.background }]}
        >
          <Text style={[styles.statusText, { color: statusColors.foreground }]}>
            {status}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.address}>
        {delivery.delivery_address} ·{" "}
        {getNeighborhoodLabel(delivery.neighborhood)}
      </Text>
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          {renderMeta(
            "calendar-range",
            `${formatShortDate(delivery.start_date)} – ${formatShortDate(delivery.end_date)}`,
          )}
          {renderMeta("snowflake", getIceLoadLabel(delivery))}
          {tip > 0
            ? renderMeta(
                "cash",
                currencyFormatter.format(tip),
                colors.moneyText,
              )
            : null}
        </View>
        <IconButton
          accessibilityLabel={`Delete delivery for ${delivery.customer_name}`}
          backgroundColor={colors.surfaceMuted}
          color={colors.danger}
          icon="trash-can-outline"
          onPress={onDelete}
          size={38}
        />
      </View>
    </PressableScale>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: Radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    titleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    name: {
      color: theme.colors.text,
      flex: 1,
      fontSize: 17,
      fontWeight: "800",
    },
    status: {
      borderRadius: Radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "800",
    },
    address: {
      color: theme.colors.textMuted,
      fontSize: 15,
      fontWeight: "500",
    },
    footer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      marginTop: 6,
    },
    metaRow: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    meta: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
    },
    metaText: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "600",
    },
  });
