import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps } from "react";

import { Delivery } from "@/api/types";
import { AddonThemeKey } from "@/constants/theme";
import { toCount } from "@/features/deliveries/delivery-utils";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface AddonDefinition {
  themeKey: AddonThemeKey;
  label: string;
  icon: IconName;
  deliveryField:
    | "bag_limes"
    | "bag_lemons"
    | "bag_oranges"
    | "marg_salt"
    | "freeze_pops";
  formField:
    | "bagLimes"
    | "bagLemons"
    | "bagOranges"
    | "margSalt"
    | "freezePops";
}

export const addonDefinitions: AddonDefinition[] = [
  {
    themeKey: AddonThemeKey.Limes,
    label: "Limes",
    icon: "fruit-citrus",
    deliveryField: "bag_limes",
    formField: "bagLimes",
  },
  {
    themeKey: AddonThemeKey.Lemons,
    label: "Lemons",
    icon: "fruit-citrus",
    deliveryField: "bag_lemons",
    formField: "bagLemons",
  },
  {
    themeKey: AddonThemeKey.Oranges,
    label: "Oranges",
    icon: "fruit-citrus",
    deliveryField: "bag_oranges",
    formField: "bagOranges",
  },
  {
    themeKey: AddonThemeKey.MargaritaSalt,
    label: "Marg salt",
    icon: "shaker-outline",
    deliveryField: "marg_salt",
    formField: "margSalt",
  },
  {
    themeKey: AddonThemeKey.FreezePops,
    label: "Freeze pops",
    icon: "ice-pop",
    deliveryField: "freeze_pops",
    formField: "freezePops",
  },
];

export const getDeliveryAddons = (delivery: Delivery) => {
  return addonDefinitions
    .map((addon) => ({
      ...addon,
      count: toCount(delivery[addon.deliveryField]),
    }))
    .filter((addon) => addon.count > 0);
};
