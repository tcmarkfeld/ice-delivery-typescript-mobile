import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAllDeliveriesQuery } from "@/api/queries/use-deliveries-query";
import { useUpdateDeliveryMutation } from "@/api/queries/use-update-delivery-mutation";
import { ApiQueryKey } from "@/api/query-keys";
import { DeliveryForm } from "@/components/delivery/delivery-form";
import { Button, ButtonVariant } from "@/components/ui/button";
import { successHaptic } from "@/components/ui/haptics";
import { ScreenHeader } from "@/components/ui/screen-header";
import { EmptyState, LoadingState } from "@/components/ui/state-views";
import {
  DeliveryFormOutput,
  getDeliveryFormValues,
  toDeliveryPayload,
} from "@/features/deliveries/delivery-form-schema";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";

export default function EditDeliveryScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { authToken } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const deliveriesQuery = useAllDeliveriesQuery(authToken);
  const updateDeliveryMutation = useUpdateDeliveryMutation();
  // iOS presents this as a page sheet, which already sits below the status bar.
  const headerTopInset = Platform.OS === "ios" ? 8 : insets.top;

  const delivery = deliveriesQuery.data?.find(
    (item) => String(item.id) === String(id),
  );

  const header = (
    <ScreenHeader
      backIcon="close"
      eyebrow={delivery?.customer_name}
      onBack={() => router.back()}
      title="Edit delivery"
      topInset={headerTopInset}
    />
  );

  const onSubmit = async (values: DeliveryFormOutput) => {
    if (!authToken || !id) {
      return;
    }

    try {
      await updateDeliveryMutation.mutateAsync({
        id: String(id),
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
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.screen }]}>
      {deliveriesQuery.isLoading ? (
        <>
          {header}
          <LoadingState />
        </>
      ) : delivery ? (
        <DeliveryForm
          contentInsetBottom={insets.bottom + 24}
          defaultValues={getDeliveryFormValues(delivery)}
          header={header}
          isSubmitting={updateDeliveryMutation.isPending}
          key={String(delivery.id)}
          onSubmit={onSubmit}
          submitError={updateDeliveryMutation.error?.message}
          submitLabel="Save changes"
        />
      ) : (
        <>
          {header}
          <EmptyState
            action={
              <Button
                label="Back to deliveries"
                onPress={() => router.back()}
                variant={ButtonVariant.Secondary}
              />
            }
            body="It may have been deleted. Pull to refresh the list and try again."
            icon="file-search-outline"
            title="Delivery not found"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
