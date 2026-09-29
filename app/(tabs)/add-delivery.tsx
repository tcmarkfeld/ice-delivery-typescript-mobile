import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCreateDeliveryMutation } from "@/api/queries/use-create-delivery-mutation";
import { ApiQueryKey } from "@/api/query-keys";
import { DeliveryForm } from "@/components/delivery/delivery-form";
import { successHaptic } from "@/components/ui/haptics";
import { ScreenHeader } from "@/components/ui/screen-header";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import {
  DeliveryFormOutput,
  getEmptyDeliveryFormValues,
  toDeliveryPayload,
} from "@/features/deliveries/delivery-form-schema";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

export default function AddDeliveryScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { authToken } = useSession();
  const { handleScroll } = useFloatingTabBar();
  const createDeliveryMutation = useCreateDeliveryMutation();
  const [formKey, setFormKey] = useState(0);

  const onSubmit = async (values: DeliveryFormOutput) => {
    if (!authToken) {
      return;
    }

    try {
      await createDeliveryMutation.mutateAsync({
        payload: toDeliveryPayload(values),
        token: authToken,
      });
    } catch {
      // Shown by the form's submit error.
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [ApiQueryKey.DeliveriesToday],
      }),
      queryClient.invalidateQueries({ queryKey: [ApiQueryKey.DeliveriesAll] }),
      queryClient.invalidateQueries({
        queryKey: [ApiQueryKey.DeliveriesByDateRange],
      }),
    ]);

    successHaptic();
    createDeliveryMutation.reset();
    setFormKey((currentKey) => currentKey + 1);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.screen }]}>
      <DeliveryForm
        autoExtendEndDate
        contentInsetBottom={floatingTabBarContentBottomPadding + insets.bottom}
        defaultValues={getEmptyDeliveryFormValues()}
        header={
          <ScreenHeader eyebrow="Add to the schedule" title="New delivery" />
        }
        isSubmitting={createDeliveryMutation.isPending}
        key={formKey}
        onScroll={handleScroll}
        onSubmit={onSubmit}
        submitError={createDeliveryMutation.error?.message}
        submitLabel="Create delivery"
      />
      <View
        pointerEvents="none"
        style={[
          styles.statusBarScrim,
          { backgroundColor: theme.colors.screen, height: insets.top },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  statusBarScrim: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
