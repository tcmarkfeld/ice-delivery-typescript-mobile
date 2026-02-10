import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { useTodayDeliveriesQuery } from '@/api/queries/use-deliveries-query';
import { Delivery } from '@/api/types';
import { DeliveryCountSummary } from '@/components/delivery/delivery-count-summary';
import { DeliveryListItem } from '@/components/delivery/delivery-list-item';
import { buildDeliverySummary, getBusinessDateKey, sortDeliveries } from '@/features/deliveries/delivery-utils';
import { useSession } from '@/hooks/use-session';

export default function TodayDeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const { authToken, clearAuthToken } = useSession();
  const deliveriesQuery = useTodayDeliveriesQuery(authToken);
  const [completedDeliveryIds, setCompletedDeliveryIds] = useState<Record<string, boolean>>({});

  const todayDateKey = getBusinessDateKey();

  const sortedDeliveries = sortDeliveries(deliveriesQuery.data ?? []);
  const deliverySummary = buildDeliverySummary(deliveriesQuery.data ?? [], todayDateKey);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Today&apos;s Deliveries</Text>
          <Pressable onPress={() => router.push('/(tabs)/tomorrow-deliveries')}>
            <Text style={styles.tomorrowLinkText}>View Tomorrow&apos;s Deliveries &gt;</Text>
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Refresh deliveries"
            onPress={() => deliveriesQuery.refetch()}
            style={styles.refreshButton}>
            <MaterialCommunityIcons color="#ffffff" name="refresh-circle" size={22} />
          </Pressable>
          <Pressable
            onPress={async () => {
              await clearAuthToken();
              router.replace('/login');
            }}
            style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      {deliveriesQuery.isLoading ? (
        <View style={styles.centeredScreen}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {deliveriesQuery.isError ? (
        <View style={styles.centeredScreen}>
          <Text style={styles.errorText}>{deliveriesQuery.error.message}</Text>
          <Pressable onPress={() => deliveriesQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!deliveriesQuery.isLoading && !deliveriesQuery.isError ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={sortedDeliveries}
          keyExtractor={(item, index) => `${String(item.id)}-${index}`}
          onRefresh={() => deliveriesQuery.refetch()}
          refreshing={deliveriesQuery.isRefetching}
          renderItem={({ item }: { item: Delivery }) => (
            <DeliveryListItem
              delivery={item}
              todayDateKey={todayDateKey}
              isCompleted={!!completedDeliveryIds[String(item.id)]}
              showAddons
              showCompletionToggle
              showPickupState
              onToggleCompleted={() => {
                const deliveryId = String(item.id);
                setCompletedDeliveryIds((currentMap) => ({
                  ...currentMap,
                  [deliveryId]: !currentMap[deliveryId],
                }));
              }}
            />
          )}
          ListHeaderComponent={
            <DeliveryCountSummary heading="Today&apos;s Counts" summary={deliverySummary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>No deliveries today</Text>
              <Text style={styles.emptyBody}>Pull down to refresh when new deliveries arrive.</Text>
            </View>
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f3f7fb',
    flex: 1,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },
  tomorrowLinkText: {
    color: '#0a7ea4',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 38,
  },
  logoutButton: {
    borderColor: '#0a7ea4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#0a7ea4',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    gap: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  centeredScreen: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyStateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe5ef',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyBody: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
