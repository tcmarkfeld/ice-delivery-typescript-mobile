import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeleteDeliveryMutation } from "@/api/queries/use-delete-delivery-mutation";
import {
  useAllDeliveriesQuery,
  useTipReportQuery,
} from "@/api/queries/use-deliveries-query";
import { ApiQueryKey } from "@/api/query-keys";
import { Delivery } from "@/api/types";
import { DeliveryListItem } from "@/components/delivery/delivery-list-item";
import { floatingTabBarContentBottomPadding } from "@/constants/navigation";
import { AppTheme } from "@/constants/theme";
import {
  isValidDateKey,
  parseIsoDateKey,
  toIsoDateKey,
} from "@/features/date/date-key-utils";
import { getBusinessDateKey } from "@/features/deliveries/delivery-utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";
import { useThemeMode } from "@/providers/app-theme-provider";
import { useFloatingTabBar } from "@/providers/floating-tab-bar-provider";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const toAmount = (value: string | number): number => {
  if (typeof value === "number") {
    return value;
  }

  const normalizedValue = value.replace(/[^0-9.-]/g, "");
  const parsedValue = Number.parseFloat(normalizedValue);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

enum TipDateField {
  Start = "start",
  End = "end",
}

interface TipReportSummary {
  totalTips: number;
  averageTipPerDelivery: number;
  deliveriesInView: number;
  deliveriesWithTip: number;
}

interface TipReportObject {
  totalTips?: unknown;
  totalTip?: unknown;
  total?: unknown;
  tipTotal?: unknown;
  averageTipPerDelivery?: unknown;
  averageTip?: unknown;
  avgTip?: unknown;
  deliveriesInView?: unknown;
  totalDeliveries?: unknown;
  deliveryCount?: unknown;
  count?: unknown;
  deliveriesWithTip?: unknown;
  tippedDeliveries?: unknown;
  results?: unknown;
  data?: unknown;
  rows?: unknown;
}

const emptyTipReportSummary: TipReportSummary = {
  averageTipPerDelivery: 0,
  deliveriesInView: 0,
  deliveriesWithTip: 0,
  totalTips: 0,
};

const summarizeTipsFromRows = (
  rows: { tip?: string | number }[],
): TipReportSummary => {
  const totalTips = rows.reduce((sum, row) => sum + toAmount(row.tip ?? 0), 0);
  const deliveriesWithTip = rows.filter(
    (row) => toAmount(row.tip ?? 0) > 0,
  ).length;
  const averageTipPerDelivery = rows.length > 0 ? totalTips / rows.length : 0;

  return {
    averageTipPerDelivery,
    deliveriesInView: rows.length,
    deliveriesWithTip,
    totalTips,
  };
};

const extractTipRows = (value: unknown): { tip?: string | number }[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is { tip?: string | number } => {
    return typeof item === "object" && item !== null && "tip" in item;
  });
};

const normalizeTipReportResponse = (
  responseData: unknown,
): TipReportSummary => {
  if (typeof responseData === "string") {
    const totalTips = toAmount(responseData);

    return {
      ...emptyTipReportSummary,
      totalTips,
    };
  }

  if (Array.isArray(responseData)) {
    const tipRows = extractTipRows(responseData);
    if (tipRows.length > 0) {
      return summarizeTipsFromRows(tipRows);
    }

    return emptyTipReportSummary;
  }

  if (typeof responseData === "number") {
    const totalTips = responseData;

    return {
      ...emptyTipReportSummary,
      totalTips,
    };
  }

  if (typeof responseData === "object" && responseData !== null) {
    const typedResponse = responseData as TipReportObject;

    const resultRows = extractTipRows(typedResponse.results);
    const dataRows = extractTipRows(typedResponse.data);
    const fallbackRows = extractTipRows(typedResponse.rows);
    const tipRows =
      resultRows.length > 0
        ? resultRows
        : dataRows.length > 0
          ? dataRows
          : fallbackRows;

    if (tipRows.length > 0) {
      return summarizeTipsFromRows(tipRows);
    }

    const totalTips = toAmount(
      String(
        typedResponse.totalTips ??
          typedResponse.totalTip ??
          typedResponse.total ??
          typedResponse.tipTotal ??
          0,
      ),
    );
    const deliveriesInView = toAmount(
      String(
        typedResponse.deliveriesInView ??
          typedResponse.totalDeliveries ??
          typedResponse.deliveryCount ??
          typedResponse.count ??
          emptyTipReportSummary.deliveriesInView,
      ),
    );
    const deliveriesWithTip = toAmount(
      String(
        typedResponse.deliveriesWithTip ??
          typedResponse.tippedDeliveries ??
          emptyTipReportSummary.deliveriesWithTip,
      ),
    );
    const averageFromApi = toAmount(
      String(
        typedResponse.averageTipPerDelivery ??
          typedResponse.averageTip ??
          typedResponse.avgTip ??
          NaN,
      ),
    );
    const averageTipPerDelivery =
      averageFromApi > 0 || deliveriesInView === 0
        ? averageFromApi
        : totalTips / deliveriesInView;

    return {
      averageTipPerDelivery,
      deliveriesInView,
      deliveriesWithTip,
      totalTips,
    };
  }

  return emptyTipReportSummary;
};

export default function AllDeliveriesScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { toggleThemeMode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const { authToken } = useSession();
  const { handleScroll } = useFloatingTabBar();
  const queryClient = useQueryClient();
  const allDeliveriesQuery = useAllDeliveriesQuery(authToken);
  const deleteDeliveryMutation = useDeleteDeliveryMutation();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isWeekFilterEnabled, setIsWeekFilterEnabled] =
    useState<boolean>(false);
  const [isTipReportOpen, setIsTipReportOpen] = useState<boolean>(false);
  const [tipReportStartDateInput, setTipReportStartDateInput] =
    useState<string>("");
  const [tipReportEndDateInput, setTipReportEndDateInput] =
    useState<string>("");
  const [tipReportStartDate, setTipReportStartDate] = useState<string>("");
  const [tipReportEndDate, setTipReportEndDate] = useState<string>("");
  const [tipReportRunId, setTipReportRunId] = useState<number>(0);
  const [activeTipDateField, setActiveTipDateField] =
    useState<TipDateField | null>(null);
  const [tipDateErrorByField, setTipDateErrorByField] = useState<
    Partial<Record<TipDateField, string>>
  >({});

  const todayDateKey = getBusinessDateKey();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deliveries = allDeliveriesQuery.data ?? [];
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const dateKeyToUtcDate = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const dateToDateKey = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const addDays = (date: Date, days: number): Date => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
  };

  const getWeekRange = (baseDateKey: string, offset: number) => {
    const baseDate = dateKeyToUtcDate(baseDateKey);
    const dayOfWeek = baseDate.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = addDays(baseDate, -daysFromMonday + offset * 7);
    const sunday = addDays(monday, 6);

    return {
      startKey: dateToDateKey(monday),
      endKey: dateToDateKey(sunday),
    };
  };

  const weekRange = getWeekRange(todayDateKey, weekOffset);

  const formatRangeLabel = (startKey: string, endKey: string): string => {
    const startDate = dateKeyToUtcDate(startKey);
    const endDate = dateKeyToUtcDate(endKey);

    const startLabel = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endLabel = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${startLabel} - ${endLabel}`;
  };

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const deliveryStart = delivery.start_date.slice(0, 10);
      const deliveryEnd = delivery.end_date.slice(0, 10);
      const hasStartDateInWeek =
        deliveryStart >= weekRange.startKey &&
        deliveryStart <= weekRange.endKey;
      const hasEndDateInWeek =
        deliveryEnd >= weekRange.startKey && deliveryEnd <= weekRange.endKey;
      const spansSelectedWeek =
        deliveryStart < weekRange.startKey && deliveryEnd > weekRange.endKey;
      const hasDateInSelectedWeek =
        hasStartDateInWeek || hasEndDateInWeek || spansSelectedWeek;

      if (isWeekFilterEnabled && !hasDateInSelectedWeek) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        delivery.customer_name,
        delivery.delivery_address,
        delivery.customer_phone,
        delivery.customer_email,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [
    deliveries,
    isWeekFilterEnabled,
    normalizedQuery,
    weekRange.endKey,
    weekRange.startKey,
  ]);
  const tipReportQuery = useTipReportQuery(
    authToken,
    tipReportStartDate,
    tipReportEndDate,
    isTipReportOpen &&
      isValidDateKey(tipReportStartDate) &&
      isValidDateKey(tipReportEndDate) &&
      tipReportRunId > 0,
    tipReportRunId,
  );
  const tipReport = useMemo(() => {
    if (tipReportRunId === 0) {
      return emptyTipReportSummary;
    }

    if (!tipReportQuery.data) {
      return emptyTipReportSummary;
    }

    return normalizeTipReportResponse(tipReportQuery.data);
  }, [tipReportQuery.data, tipReportRunId]);

  const openTipReport = () => {
    const defaultStartDate = weekRange.startKey;
    const defaultEndDate = weekRange.endKey;

    setTipReportStartDateInput(defaultStartDate);
    setTipReportEndDateInput(defaultEndDate);
    setTipReportStartDate(defaultStartDate);
    setTipReportEndDate(defaultEndDate);
    setTipReportRunId(0);
    setTipDateErrorByField({});
    setIsTipReportOpen(true);
  };

  const closeTipReport = () => {
    setActiveTipDateField(null);
    setIsTipReportOpen(false);
  };

  const onTipDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setActiveTipDateField(null);
      return;
    }

    if (!selectedDate || !activeTipDateField) {
      setActiveTipDateField(null);
      return;
    }

    const nextDateKey = toIsoDateKey(selectedDate);

    if (activeTipDateField === TipDateField.Start) {
      setTipReportStartDateInput(nextDateKey);
      setTipDateErrorByField((currentErrors) => ({
        ...currentErrors,
        [TipDateField.Start]: undefined,
      }));
    }

    if (activeTipDateField === TipDateField.End) {
      setTipReportEndDateInput(nextDateKey);
      setTipDateErrorByField((currentErrors) => ({
        ...currentErrors,
        [TipDateField.End]: undefined,
      }));
    }

    if (Platform.OS === "android") {
      setActiveTipDateField(null);
    }
  };

  const openTipDatePicker = (field: TipDateField) => {
    const fieldDateKey =
      field === TipDateField.Start
        ? tipReportStartDateInput
        : tipReportEndDateInput;
    const currentDate = parseIsoDateKey(fieldDateKey);

    if (Platform.OS === "android") {
      setActiveTipDateField(field);
      DateTimePickerAndroid.open({
        mode: "date",
        value: currentDate,
        onChange: (event, selectedDate) => {
          setActiveTipDateField(field);
          onTipDateChange(event, selectedDate);
        },
      });
      return;
    }

    setActiveTipDateField(field);
  };

  const applyTipReportDates = () => {
    const nextErrors: Partial<Record<TipDateField, string>> = {};

    if (!isValidDateKey(tipReportStartDateInput)) {
      nextErrors[TipDateField.Start] = "Use YYYY-MM-DD";
    }

    if (!isValidDateKey(tipReportEndDateInput)) {
      nextErrors[TipDateField.End] = "Use YYYY-MM-DD";
    }

    if (
      isValidDateKey(tipReportStartDateInput) &&
      isValidDateKey(tipReportEndDateInput) &&
      tipReportStartDateInput > tipReportEndDateInput
    ) {
      nextErrors[TipDateField.End] = "End date must be after start date";
    }

    setTipDateErrorByField(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setTipReportStartDate(tipReportStartDateInput);
    setTipReportEndDate(tipReportEndDateInput);
    setTipReportRunId((currentValue) => currentValue + 1);
  };

  const onConfirmDeleteDelivery = (delivery: Delivery) => {
    if (!authToken) {
      return;
    }

    Alert.alert(
      "Delete Delivery",
      `Delete delivery for ${delivery.customer_name}? This cannot be undone.`,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDeliveryMutation.mutateAsync({
                id: String(delivery.id),
                token: authToken,
              });

              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: [ApiQueryKey.DeliveriesToday],
                }),
                queryClient.invalidateQueries({
                  queryKey: [ApiQueryKey.DeliveriesAll],
                }),
                queryClient.invalidateQueries({
                  queryKey: [ApiQueryKey.DeliveriesByDateRange],
                }),
              ]);
            } catch {
              Alert.alert(
                "Delete Failed",
                "Could not delete this delivery. Please try again.",
              );
            }
          },
        },
      ],
    );
  };
  const themeToggleIconName =
    theme.scheme === "dark" ? "white-balance-sunny" : "moon-waxing-crescent";

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>All Deliveries</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Open tip report"
            onPress={openTipReport}
            style={styles.tipButton}
          >
            <MaterialCommunityIcons
              color={theme.colors.iconOnPrimary}
              name="cash-multiple"
              size={20}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Toggle theme"
            onPress={toggleThemeMode}
            style={styles.themeToggleButton}
          >
            <MaterialCommunityIcons
              color={theme.colors.primaryText}
              name={themeToggleIconName}
              size={20}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Refresh deliveries"
            onPress={() => allDeliveriesQuery.refetch()}
            style={styles.refreshButton}
          >
            <MaterialCommunityIcons
              color={theme.colors.iconOnPrimary}
              name="refresh-circle"
              size={22}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          onChangeText={setSearchQuery}
          placeholder="Search name, address, phone, or email"
          placeholderTextColor={theme.colors.textSubtle}
          style={styles.searchInput}
          value={searchQuery}
        />
      </View>
      <View style={styles.filterCard}>
        <View style={styles.filterCardHeader}>
          <Text style={styles.filterCardTitle}>Week Filter</Text>
          <Pressable
            onPress={() =>
              setIsWeekFilterEnabled((currentValue) => !currentValue)
            }
            style={[
              styles.weekModeButton,
              isWeekFilterEnabled
                ? styles.weekModeButtonEnabled
                : styles.weekModeButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.weekModeButtonText,
                isWeekFilterEnabled
                  ? styles.weekModeButtonTextEnabled
                  : styles.weekModeButtonTextDisabled,
              ]}
            >
              {isWeekFilterEnabled ? "On" : "Off"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.weekFilterContainer}>
          <Pressable
            disabled={!isWeekFilterEnabled}
            onPress={() => setWeekOffset((currentOffset) => currentOffset - 1)}
            style={[
              styles.weekButton,
              !isWeekFilterEnabled ? styles.weekButtonDisabled : undefined,
            ]}
          >
            <Text style={styles.weekButtonText}>Prev</Text>
          </Pressable>
          <View style={styles.weekLabelContainer}>
            <Text style={styles.weekLabel}>
              {formatRangeLabel(weekRange.startKey, weekRange.endKey)}
            </Text>
          </View>
          <Pressable
            disabled={!isWeekFilterEnabled}
            onPress={() => setWeekOffset((currentOffset) => currentOffset + 1)}
            style={[
              styles.weekButton,
              !isWeekFilterEnabled ? styles.weekButtonDisabled : undefined,
            ]}
          >
            <Text style={styles.weekButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
      {isWeekFilterEnabled && weekOffset !== 0 ? (
        <View style={styles.weekResetContainer}>
          <Pressable
            onPress={() => setWeekOffset(0)}
            style={styles.weekResetButton}
          >
            <Text style={styles.weekResetButtonText}>Back to Current Week</Text>
          </Pressable>
        </View>
      ) : null}

      {allDeliveriesQuery.isLoading ? (
        <View style={styles.centeredScreen}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {allDeliveriesQuery.isError ? (
        <View style={styles.centeredScreen}>
          <Text style={styles.errorText}>
            {allDeliveriesQuery.error.message}
          </Text>
          <Pressable
            onPress={() => allDeliveriesQuery.refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!allDeliveriesQuery.isLoading && !allDeliveriesQuery.isError ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredDeliveries}
          keyExtractor={(item, index) => `${String(item.id)}-${index}`}
          onScroll={handleScroll}
          onRefresh={() => allDeliveriesQuery.refetch()}
          refreshing={allDeliveriesQuery.isRefetching}
          renderItem={({ item }: { item: Delivery }) => (
            <DeliveryListItem
              delivery={item}
              onPressDelete={() => onConfirmDeleteDelivery(item)}
              onPressEdit={() =>
                router.push(`/(tabs)/edit-delivery?id=${String(item.id)}`)
              }
              showDeleteAction
              showEditAction
              todayDateKey={todayDateKey}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyTitle}>
                {normalizedQuery ? "No matches found" : "No deliveries found"}
              </Text>
              <Text style={styles.emptyBody}>
                {normalizedQuery
                  ? "Try a different search term."
                  : isWeekFilterEnabled
                    ? "Try another week or pull down to refresh."
                    : "Pull down to refresh and try again."}
              </Text>
            </View>
          }
          scrollEventThrottle={16}
        />
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={closeTipReport}
        transparent
        visible={isTipReportOpen}
      >
        <Pressable onPress={closeTipReport} style={styles.modalOverlay}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tip Report</Text>
              <Pressable
                onPress={closeTipReport}
                style={styles.modalCloseButton}
              >
                <MaterialCommunityIcons
                  color={theme.colors.textMuted}
                  name="close"
                  size={20}
                />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Run tip totals from endpoint for a date range.
            </Text>

            <View style={styles.tipDateInputRow}>
              <View style={styles.tipDateInputGroup}>
                <Text style={styles.tipDateLabel}>Start</Text>
                <Pressable
                  onPress={() => openTipDatePicker(TipDateField.Start)}
                  style={[styles.tipDateInput, styles.tipDateSelector]}
                >
                  <Text style={styles.tipDateValue}>
                    {tipReportStartDateInput}
                  </Text>
                </Pressable>
                {tipDateErrorByField[TipDateField.Start] ? (
                  <Text style={styles.tipDateError}>
                    {tipDateErrorByField[TipDateField.Start]}
                  </Text>
                ) : null}
              </View>
              <View style={styles.tipDateInputGroup}>
                <Text style={styles.tipDateLabel}>End</Text>
                <Pressable
                  onPress={() => openTipDatePicker(TipDateField.End)}
                  style={[styles.tipDateInput, styles.tipDateSelector]}
                >
                  <Text style={styles.tipDateValue}>
                    {tipReportEndDateInput}
                  </Text>
                </Pressable>
                {tipDateErrorByField[TipDateField.End] ? (
                  <Text style={styles.tipDateError}>
                    {tipDateErrorByField[TipDateField.End]}
                  </Text>
                ) : null}
              </View>
            </View>

            {Platform.OS === "ios" && activeTipDateField ? (
              <View style={styles.tipDatePickerContainer}>
                <View style={styles.tipDatePickerHeader}>
                  <Text style={styles.tipDatePickerTitle}>Select Date</Text>
                  <Pressable
                    onPress={() => setActiveTipDateField(null)}
                    style={styles.tipDatePickerDoneButton}
                  >
                    <Text style={styles.tipDatePickerDoneText}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  display="inline"
                  mode="date"
                  onChange={onTipDateChange}
                  themeVariant={theme.datePickerVariant}
                  value={parseIsoDateKey(
                    activeTipDateField === TipDateField.Start
                      ? tipReportStartDateInput
                      : tipReportEndDateInput,
                  )}
                />
              </View>
            ) : null}

            <Pressable
              disabled={tipReportQuery.isFetching}
              onPress={applyTipReportDates}
              style={[
                styles.tipRunButton,
                tipReportQuery.isFetching
                  ? styles.tipRunButtonDisabled
                  : undefined,
              ]}
            >
              {tipReportQuery.isFetching ? (
                <ActivityIndicator
                  color={theme.colors.iconOnPrimary}
                  size="small"
                />
              ) : (
                <MaterialCommunityIcons
                  color={theme.colors.iconOnPrimary}
                  name="chart-line"
                  size={16}
                />
              )}
              <Text style={styles.tipRunButtonText}>
                {tipReportQuery.isFetching ? "Running..." : "Run Report"}
              </Text>
            </Pressable>

            {tipReportQuery.isLoading ? (
              <View style={styles.tipStatusRow}>
                <ActivityIndicator size="small" />
                <Text style={styles.tipStatusText}>Loading report...</Text>
              </View>
            ) : null}

            {tipReportQuery.isError ? (
              <Text style={styles.tipQueryErrorText}>
                Tip endpoint unavailable ({tipReportQuery.error.message}).
              </Text>
            ) : null}

            <Text style={styles.tipAppliedRangeText}>
              Active range: {tipReportStartDate || "--"} to{" "}
              {tipReportEndDate || "--"}
            </Text>

            <View style={styles.tipStatGrid}>
              <View style={styles.tipStatCard}>
                <Text style={styles.tipStatValue}>
                  {currencyFormatter.format(tipReport.totalTips)}
                </Text>
                <Text style={styles.tipStatLabel}>Total Tips</Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.screen,
      flex: 1,
    },
    headerRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    pageTitle: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "800",
    },
    headerActions: {
      flexDirection: "row",
      gap: 8,
    },
    refreshButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 38,
    },
    tipButton: {
      alignItems: "center",
      backgroundColor: theme.colors.success,
      borderRadius: 9,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 38,
    },
    themeToggleButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryMuted,
      borderColor: theme.colors.primary,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      justifyContent: "center",
      minHeight: 38,
      minWidth: 38,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    searchInput: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      color: theme.colors.text,
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    filterCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 10,
    },
    filterCardHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    filterCardTitle: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    weekFilterContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    weekModeButton: {
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    weekModeButtonEnabled: {
      backgroundColor: theme.colors.successMuted,
      borderColor: theme.colors.success,
    },
    weekModeButtonDisabled: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.borderStrong,
    },
    weekModeButtonText: {
      fontSize: 12,
      fontWeight: "700",
    },
    weekModeButtonTextEnabled: {
      color: theme.colors.success,
    },
    weekModeButtonTextDisabled: {
      color: theme.colors.textSubtle,
    },
    weekButton: {
      backgroundColor: theme.colors.disabledSurface,
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    weekButtonDisabled: {
      opacity: 0.45,
    },
    weekButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: "700",
    },
    weekLabelContainer: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    weekLabel: {
      color: theme.colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    weekResetContainer: {
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    weekResetButton: {
      alignSelf: "flex-start",
      borderColor: theme.colors.primary,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    weekResetButtonText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    listContent: {
      gap: 10,
      paddingBottom: floatingTabBarContentBottomPadding,
      paddingHorizontal: 16,
    },
    centeredScreen: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      marginBottom: 10,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: theme.colors.iconOnPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    emptyStateCard: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 22,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    emptyBody: {
      color: theme.colors.textSubtle,
      fontSize: 14,
      marginTop: 6,
      textAlign: "center",
    },
    modalOverlay: {
      alignItems: "center",
      backgroundColor: theme.colors.overlay,
      flex: 1,
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 14,
      width: "100%",
    },
    modalHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    modalTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "800",
    },
    modalCloseButton: {
      alignItems: "center",
      borderColor: theme.colors.borderStrong,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    modalSubtitle: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      marginBottom: 12,
    },
    tipDateInputRow: {
      flexDirection: "row",
      gap: 8,
    },
    tipDateInputGroup: {
      flex: 1,
    },
    tipDateLabel: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 4,
    },
    tipDateInput: {
      alignItems: "center",
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    tipDateSelector: {
      justifyContent: "center",
    },
    tipDateValue: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    tipDateError: {
      color: theme.colors.danger,
      fontSize: 11,
      marginTop: 4,
    },
    tipDatePickerContainer: {
      backgroundColor: theme.colors.modalSurface,
      borderColor: theme.colors.border,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 8,
      marginBottom: 10,
      overflow: "hidden",
    },
    tipDatePickerHeader: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    tipDatePickerTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    tipDatePickerDoneButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    tipDatePickerDoneText: {
      color: theme.colors.iconOnPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    tipRunButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      marginTop: 10,
      marginBottom: 10,
      paddingVertical: 9,
    },
    tipRunButtonDisabled: {
      opacity: 0.7,
    },
    tipRunButtonText: {
      color: theme.colors.iconOnPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    tipStatusRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    tipStatusText: {
      color: theme.colors.textMuted,
      fontSize: 13,
    },
    tipQueryErrorText: {
      color: theme.colors.danger,
      fontSize: 12,
      marginBottom: 8,
    },
    tipAppliedRangeText: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      marginBottom: 8,
    },
    tipStatGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tipStatCard: {
      backgroundColor: theme.colors.tileSurface,
      borderColor: theme.colors.border,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      minWidth: 130,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    tipStatValue: {
      color: theme.colors.moneyText,
      fontSize: 17,
      fontWeight: "800",
    },
    tipStatLabel: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      marginTop: 2,
    },
  });
