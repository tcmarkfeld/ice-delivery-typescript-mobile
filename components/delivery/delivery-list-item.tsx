import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useMemo, type ComponentProps } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Delivery } from "@/api/types";
import { AddonThemeKey, AppTheme } from "@/constants/theme";
import { addDaysToDateKey } from "@/features/date/date-key-utils";
import {
  getDateKeyFromIso,
  toCount,
} from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";

interface DeliveryListItemProps {
  delivery: Delivery;
  todayDateKey: string;
  isCompleted?: boolean;
  onToggleCompleted?: () => void;
  showPickupState?: boolean;
  showCompletionToggle?: boolean;
  showAddons?: boolean;
  showEditAction?: boolean;
  onPressEdit?: () => void;
  showDeleteAction?: boolean;
  onPressDelete?: () => void;
}

enum AddonLabel {
  BagLimes = "Limes",
  BagLemons = "Lemons",
  BagOranges = "Oranges",
  MargaritaSalt = "Marg Salt",
  FreezePops = "Freeze Pops",
}

interface DeliveryAddon {
  label: AddonLabel;
  count: number;
  iconName: AddonIconName;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

enum AddonIconName {
  BagLimes = "fruit-citrus",
  BagLemons = "fruit-citrus",
  BagOranges = "fruit-citrus",
  MargaritaSalt = "shaker-outline",
  FreezePops = "ice-cream",
}

const addonThemeKeyByLabel: Record<AddonLabel, AddonThemeKey> = {
  [AddonLabel.BagLimes]: AddonThemeKey.Limes,
  [AddonLabel.BagLemons]: AddonThemeKey.Lemons,
  [AddonLabel.BagOranges]: AddonThemeKey.Oranges,
  [AddonLabel.MargaritaSalt]: AddonThemeKey.MargaritaSalt,
  [AddonLabel.FreezePops]: AddonThemeKey.FreezePops,
};

const formatDate = (isoDateString: string): string => {
  const dateKey = getDateKeyFromIso(isoDateString);
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const openMaps = async (address: string): Promise<void> => {
  const destination = encodeURIComponent(`${address} Corolla, NC 27927`);
  const provider = Platform.OS === "ios" ? "apple" : "google";
  const link = `http://maps.${provider}.com/?daddr=${destination}`;
  await Linking.openURL(link);
};

const callCustomer = async (phone: string): Promise<void> => {
  await Linking.openURL(`tel:${phone}`);
};

const textCustomer = async (name: string, phone: string): Promise<void> => {
  const firstName = name.split(" ")[0] ?? "there";
  const message = `Hey ${firstName}, this is Benicio with Corolla Ice Delivery. Just wanted to thank you for your business this past week and hope you enjoyed! If you would be willing to leave us a Google review we would really appreciate it! 
  https://g.page/r/CUBe_7herDpHEAE/review`;
  const encodedMessage = encodeURIComponent(message);

  await Linking.openURL(`sms:${phone}?body=${encodedMessage}`);
};

export const DeliveryListItem = ({
  delivery,
  todayDateKey,
  isCompleted = false,
  onToggleCompleted,
  showPickupState = false,
  showCompletionToggle = false,
  showAddons = false,
  showEditAction = false,
  onPressEdit,
  showDeleteAction = false,
  onPressDelete,
}: DeliveryListItemProps) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const startDateKey = getDateKeyFromIso(delivery.start_date);
  const endDateKey = getDateKeyFromIso(delivery.end_date);
  const yesterdayDateKey = addDaysToDateKey(todayDateKey, -1);
  const isPickup = showPickupState && endDateKey === yesterdayDateKey;
  const isNew = startDateKey === todayDateKey;

  const coolerCount = toCount(delivery.cooler_num);
  const coolerPrefix = coolerCount > 1 ? `${coolerCount}x ` : "";

  const hasSpecialInstructions =
    delivery.special_instructions.length > 0 &&
    delivery.special_instructions.toLowerCase() !== "none";
  const addons: DeliveryAddon[] = [
    {
      label: AddonLabel.BagLimes,
      count: toCount(delivery.bag_limes),
      iconName: AddonIconName.BagLimes,
    },
    {
      label: AddonLabel.BagLemons,
      count: toCount(delivery.bag_lemons),
      iconName: AddonIconName.BagLemons,
    },
    {
      label: AddonLabel.BagOranges,
      count: toCount(delivery.bag_oranges),
      iconName: AddonIconName.BagOranges,
    },
    {
      label: AddonLabel.MargaritaSalt,
      count: toCount(delivery.marg_salt),
      iconName: AddonIconName.MargaritaSalt,
    },
    {
      label: AddonLabel.FreezePops,
      count: toCount(delivery.freeze_pops),
      iconName: AddonIconName.FreezePops,
    },
  ].filter((addon) => addon.count > 0);
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.deliveryCard,
        isPickup ? styles.pickupCard : undefined,
        isCompleted ? styles.completedCard : undefined,
      ]}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryDateText}>
          {formatDate(delivery.start_date) +
            " to " +
            formatDate(delivery.end_date)}
        </Text>
        <View style={styles.headerBadges}>
          {isPickup ? (
            <View style={styles.pickupBadge}>
              <MaterialCommunityIcons
                color={colors.danger}
                name="truck-check-outline"
                size={13}
              />
              <Text style={styles.pickupBadgeText}>PICKUP TODAY</Text>
            </View>
          ) : null}
          {isNew ? <Text style={styles.newBadge}>NEW</Text> : null}
        </View>
      </View>

      {showCompletionToggle ? (
        <Pressable onPress={onToggleCompleted} style={styles.completedToggle}>
          <Text style={styles.completedToggleText}>Completed:</Text>
          <MaterialCommunityIcons
            color={colors.textMuted}
            name={
              isCompleted ? "check-circle" : "checkbox-blank-circle-outline"
            }
            size={18}
          />
        </Pressable>
      ) : null}

      <Text style={styles.deliveryName}>{delivery.customer_name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.deliveryAddress}>{delivery.delivery_address}</Text>
        <Text style={styles.deliveryMetaText}>
          {coolerPrefix}
          {delivery.cooler_size} {delivery.ice_type}
        </Text>
      </View>

      {showAddons && addons.length > 0 ? (
        <View style={styles.deliveryAddonsContainer}>
          {addons.map((addon) => {
            const addonPalette =
              colors.addon[addonThemeKeyByLabel[addon.label]];

            return (
              <View
                key={addon.label}
                style={[
                  styles.deliveryAddonPill,
                  {
                    backgroundColor: addonPalette.backgroundColor,
                    borderColor: addonPalette.borderColor,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={addonPalette.iconColor}
                  name={addon.iconName as IconName}
                  size={15}
                />
                <Text
                  style={[
                    styles.deliveryAddonsText,
                    { color: addonPalette.textColor },
                  ]}
                >
                  {addon.count} {addon.label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {hasSpecialInstructions ? (
        <Text style={styles.deliveryInstructions}>
          Note: {delivery.special_instructions}
        </Text>
      ) : null}

      <View style={styles.deliveryActions}>
        <Pressable
          onPress={() => openMaps(delivery.delivery_address)}
          style={styles.deliveryActionButton}
        >
          <MaterialCommunityIcons
            color={colors.primary}
            name="map-marker-radius"
            size={16}
          />
          <Text style={styles.deliveryActionText}>Map</Text>
        </Pressable>
        <Pressable
          onPress={() => callCustomer(delivery.customer_phone)}
          style={styles.deliveryActionButton}
        >
          <MaterialCommunityIcons color={colors.primary} name="phone" size={16} />
          <Text style={styles.deliveryActionText}>Call</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            textCustomer(delivery.customer_name, delivery.customer_phone)
          }
          style={styles.deliveryActionButton}
        >
          <MaterialCommunityIcons
            color={colors.primary}
            name="message-text"
            size={16}
          />
          <Text style={styles.deliveryActionText}>Text</Text>
        </Pressable>
        {showEditAction ? (
          <Pressable onPress={onPressEdit} style={styles.deliveryActionButton}>
            <MaterialCommunityIcons
              color={colors.primary}
              name="square-edit-outline"
              size={16}
            />
            <Text style={styles.deliveryActionText}>Edit</Text>
          </Pressable>
        ) : null}
        {showDeleteAction ? (
          <Pressable
            onPress={onPressDelete}
            style={styles.deliveryActionButton}
          >
            <MaterialCommunityIcons
              color={colors.danger}
              name="trash-can-outline"
              size={16}
            />
            <Text style={styles.deliveryDeleteActionText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  deliveryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  pickupCard: {
    backgroundColor: theme.colors.pickupSurface,
    borderColor: theme.colors.pickupBorder,
  },
  completedCard: {
    backgroundColor: theme.colors.completedSurface,
    borderColor: theme.colors.completedBorder,
  },
  deliveryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerBadges: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  deliveryDateText: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontWeight: "600",
  },
  newBadge: {
    backgroundColor: theme.colors.newSurface,
    borderRadius: 999,
    color: theme.colors.newText,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pickupBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.dangerMuted,
    borderColor: theme.colors.pickupBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pickupBadgeText: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: "800",
  },
  deliveryName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  deliveryAddress: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 13,
    paddingRight: 8,
  },
  deliveryMetaText: {
    color: theme.colors.primaryText,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  deliveryInstructions: {
    color: theme.colors.textSubtle,
    fontSize: 13,
  },
  deliveryAddonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deliveryAddonPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  deliveryAddonsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },
  completedToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
  },
  completedToggleText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryActionButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  deliveryActionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  deliveryDeleteActionText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
