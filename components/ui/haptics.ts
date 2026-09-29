import * as Haptics from "expo-haptics";

const hasHaptics = process.env.EXPO_OS !== "web";

export const selectionHaptic = () => {
  if (hasHaptics) {
    void Haptics.selectionAsync();
  }
};

export const successHaptic = () => {
  if (hasHaptics) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

export const lightImpactHaptic = () => {
  if (hasHaptics) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};
