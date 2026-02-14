import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import type { ComponentProps } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Delivery } from "@/api/types";
import { addDaysToDateKey } from "@/features/date/date-key-utils";
import {
  getDateKeyFromIso,
  toCount,
} from "@/features/deliveries/delivery-utils";

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

interface AddonPalette {
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

const addonPaletteByLabel: Record<AddonLabel, AddonPalette> = {
  [AddonLabel.BagLimes]: {
    backgroundColor: "#ecfdf3",
    borderColor: "#86efac",
    iconColor: "#15803d",
    textColor: "#166534",
  },
  [AddonLabel.BagLemons]: {
    backgroundColor: "#fefce8",
    borderColor: "#fde047",
    iconColor: "#a16207",
    textColor: "#854d0e",
  },
  [AddonLabel.BagOranges]: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    iconColor: "#c2410c",
    textColor: "#9a3412",
  },
  [AddonLabel.MargaritaSalt]: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    iconColor: "#334155",
    textColor: "#334155",
  },
  [AddonLabel.FreezePops]: {
    backgroundColor: "#eef2ff",
    borderColor: "#a5b4fc",
    iconColor: "#4338ca",
    textColor: "#3730a3",
  },
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
  const message = `Hey ${firstName}, this is Corolla Ice Delivery. Thanks for your business this week.`;
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
                color="#be123c"
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
            color="#334155"
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
          {addons.map((addon) => (
            <View
              key={addon.label}
              style={[
                styles.deliveryAddonPill,
                {
                  backgroundColor:
                    addonPaletteByLabel[addon.label].backgroundColor,
                },
                { borderColor: addonPaletteByLabel[addon.label].borderColor },
              ]}
            >
              <MaterialCommunityIcons
                color={addonPaletteByLabel[addon.label].iconColor}
                name={addon.iconName as IconName}
                size={15}
              />
              <Text
                style={[
                  styles.deliveryAddonsText,
                  { color: addonPaletteByLabel[addon.label].textColor },
                ]}
              >
                {addon.count} {addon.label}
              </Text>
            </View>
          ))}
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
            color="#1f6aa5"
            name="map-marker-radius"
            size={16}
          />
          <Text style={styles.deliveryActionText}>Map</Text>
        </Pressable>
        <Pressable
          onPress={() => callCustomer(delivery.customer_phone)}
          style={styles.deliveryActionButton}
        >
          <MaterialCommunityIcons color="#1f6aa5" name="phone" size={16} />
          <Text style={styles.deliveryActionText}>Call</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            textCustomer(delivery.customer_name, delivery.customer_phone)
          }
          style={styles.deliveryActionButton}
        >
          <MaterialCommunityIcons
            color="#1f6aa5"
            name="message-text"
            size={16}
          />
          <Text style={styles.deliveryActionText}>Text</Text>
        </Pressable>
        {showEditAction ? (
          <Pressable onPress={onPressEdit} style={styles.deliveryActionButton}>
            <MaterialCommunityIcons
              color="#1f6aa5"
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
              color="#b91c1c"
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

const styles = StyleSheet.create({
  deliveryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe5ef",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  pickupCard: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  completedCard: {
    backgroundColor: "#ecfdf3",
    borderColor: "#86efac",
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
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  newBadge: {
    backgroundColor: "#ecfeff",
    borderRadius: 999,
    color: "#0e7490",
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pickupBadge: {
    alignItems: "center",
    backgroundColor: "#ffe4e6",
    borderColor: "#fda4af",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pickupBadgeText: {
    color: "#be123c",
    fontSize: 11,
    fontWeight: "800",
  },
  deliveryName: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  deliveryAddress: {
    color: "#334155",
    flex: 1,
    fontSize: 13,
    paddingRight: 8,
  },
  deliveryMetaText: {
    color: "#1e3a8a",
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
    color: "#6b7280",
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
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryActionButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  deliveryActionText: {
    color: "#1f6aa5",
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryDeleteActionText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
});
