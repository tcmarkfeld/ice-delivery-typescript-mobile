import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button, IconName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDatePicker } from "@/components/ui/date-picker-sheet";
import { selectionHaptic } from "@/components/ui/haptics";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { TextField } from "@/components/ui/text-field";
import { AppTheme, Radius, ToneKey } from "@/constants/theme";
import {
  addDaysToDateKey,
  parseIsoDateKey,
  toIsoDateKey,
} from "@/features/date/date-key-utils";
import { addonDefinitions } from "@/features/deliveries/addons";
import {
  CoolerSizeOption,
  DayOrNightOption,
  DeliveryFormInput,
  DeliveryFormOutput,
  deliveryFormSchema,
  formatPhoneNumber,
  IceTypeOption,
} from "@/features/deliveries/delivery-form-schema";
import { getBagCount } from "@/features/deliveries/delivery-utils";
import { neighborhoodData } from "@/features/neighborhood/constants";
import { detectNeighborhoodFromAddress } from "@/features/neighborhood/detect-neighborhood";
import { useAppTheme } from "@/hooks/use-app-theme";

interface DeliveryFormProps {
  defaultValues: DeliveryFormInput;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
  onSubmit: (values: DeliveryFormOutput) => Promise<void>;
  /** New deliveries default to a week-long rental when the start date changes. */
  autoExtendEndDate?: boolean;
  header?: ReactNode;
  contentInsetTop?: number;
  contentInsetBottom?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const defaultRentalLengthDays = 6;
const tipQuickPicks = ["0", "5", "10", "20"];

const coolerSizeOptions = [
  { value: CoolerSizeOption.Quart40, label: "Small", detail: "40 qt" },
  { value: CoolerSizeOption.Quart62, label: "Large", detail: "62 qt" },
  { value: CoolerSizeOption.Quart200, label: "XL", detail: "200 qt" },
];

const iceTypeOptions = [
  { value: IceTypeOption.Loose, label: "Loose ice" },
  { value: IceTypeOption.Bagged, label: "Bagged ice" },
];

const formatLongDate = (dateKey: string): string => {
  return parseIsoDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const getRentalLengthDays = (startDate: string, endDate: string): number => {
  const dayInMs = 24 * 60 * 60 * 1000;
  return (
    Math.round(
      (parseIsoDateKey(endDate).getTime() -
        parseIsoDateKey(startDate).getTime()) /
        dayInMs,
    ) + 1
  );
};

export function DeliveryForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  submitError,
  onSubmit,
  autoExtendEndDate = false,
  header,
  contentInsetTop = 0,
  contentInsetBottom = 0,
  onScroll,
}: DeliveryFormProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const { openDatePicker, datePickerSheet } = useDatePicker();
  const [isNeighborhoodSheetOpen, setIsNeighborhoodSheetOpen] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormInput, undefined, DeliveryFormOutput>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues,
  });

  const [
    startDate,
    endDate,
    deliveryAddress,
    neighborhood,
    coolerSize,
    iceType,
    coolerCount,
  ] = useWatch({
    control,
    name: [
      "startDate",
      "endDate",
      "deliveryAddress",
      "neighborhood",
      "coolerSize",
      "iceType",
      "coolerCount",
    ],
  });
  const detectedNeighborhood = detectNeighborhoodFromAddress(deliveryAddress);
  const selectedNeighborhood = neighborhoodData.find(
    (option) => option.value === neighborhood,
  );
  const rentalLengthDays = getRentalLengthDays(startDate, endDate);

  useEffect(() => {
    if (detectedNeighborhood && neighborhood !== detectedNeighborhood.value) {
      setValue("neighborhood", detectedNeighborhood.value, {
        shouldValidate: true,
      });
    }
  }, [detectedNeighborhood, neighborhood, setValue]);

  const pickDate = (field: "startDate" | "endDate") => {
    openDatePicker({
      title: field === "startDate" ? "First delivery" : "Last delivery",
      value: parseIsoDateKey(field === "startDate" ? startDate : endDate),
      onSelect: (date) => {
        const dateKey = toIsoDateKey(date);
        setValue(field, dateKey, { shouldValidate: true });

        if (field === "startDate" && autoExtendEndDate) {
          setValue(
            "endDate",
            addDaysToDateKey(dateKey, defaultRentalLengthDays),
            {
              shouldValidate: true,
            },
          );
        }
      },
    });
  };

  const renderSection = (
    icon: IconName,
    title: string,
    children: ReactNode,
  ) => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons
            color={colors.primaryText}
            name={icon}
            size={18}
          />
        </View>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );

  const renderDateTile = (field: "startDate" | "endDate", label: string) => {
    const dateKey = field === "startDate" ? startDate : endDate;
    const error = errors[field]?.message;

    return (
      <Pressable
        accessibilityLabel={`${label}, ${formatLongDate(dateKey)}`}
        accessibilityRole="button"
        onPress={() => pickDate(field)}
        style={[
          styles.dateTile,
          error ? { borderColor: colors.danger } : undefined,
        ]}
      >
        <Text style={styles.dateTileLabel}>{label}</Text>
        <Text style={styles.dateTileValue}>{formatLongDate(dateKey)}</Text>
      </Pressable>
    );
  };

  return (
    <>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentInsetBottom, paddingTop: contentInsetTop },
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {header}

        {renderSection(
          "account-outline",
          "Customer",
          <>
            <Controller
              control={control}
              name="customerName"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  autoCapitalize="words"
                  autoComplete="name"
                  error={errors.customerName?.message}
                  label="Name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  placeholder="Jane Smith"
                  returnKeyType="next"
                  submitBehavior="submit"
                  textContentType="name"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  autoComplete="tel"
                  error={errors.phoneNumber?.message}
                  icon="phone-outline"
                  keyboardType="phone-pad"
                  label="Phone"
                  onBlur={onBlur}
                  onChangeText={(nextValue) =>
                    onChange(formatPhoneNumber(nextValue))
                  }
                  placeholder="(555) 555-5555"
                  ref={phoneInputRef}
                  textContentType="telephoneNumber"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  icon="email-outline"
                  keyboardType="email-address"
                  label="Email · optional"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="jane@example.com"
                  textContentType="emailAddress"
                  value={value}
                />
              )}
            />
          </>,
        )}

        {renderSection(
          "map-marker-outline",
          "Rental address",
          <>
            <Controller
              control={control}
              name="deliveryAddress"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextField
                  autoCapitalize="words"
                  error={errors.deliveryAddress?.message}
                  label="Street address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="1043 Ocean Trail"
                  value={value}
                />
              )}
            />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Neighborhood</Text>
              <Pressable
                accessibilityHint="Opens the neighborhood list"
                accessibilityLabel={`Neighborhood, ${selectedNeighborhood?.label ?? "not set"}`}
                accessibilityRole="button"
                onPress={() => setIsNeighborhoodSheetOpen(true)}
                style={styles.pickerRow}
              >
                <Text numberOfLines={1} style={styles.pickerValue}>
                  {selectedNeighborhood?.label ?? "Choose neighborhood"}
                </Text>
                {detectedNeighborhood?.value === neighborhood ? (
                  <View
                    style={[
                      styles.detectedBadge,
                      { backgroundColor: colors.tone[ToneKey.Done].background },
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={colors.tone[ToneKey.Done].foreground}
                      name="auto-fix"
                      size={13}
                    />
                    <Text
                      style={[
                        styles.detectedText,
                        { color: colors.tone[ToneKey.Done].foreground },
                      ]}
                    >
                      Auto
                    </Text>
                  </View>
                ) : null}
                <MaterialCommunityIcons
                  color={colors.textSubtle}
                  name="chevron-down"
                  size={22}
                />
              </Pressable>
              {errors.neighborhood?.message ? (
                <Text style={styles.errorText}>
                  {errors.neighborhood.message}
                </Text>
              ) : null}
            </View>
          </>,
        )}

        {renderSection(
          "calendar-range",
          "Rental dates",
          <>
            <View style={styles.dateRow}>
              {renderDateTile("startDate", "First delivery")}
              <MaterialCommunityIcons
                color={colors.textSubtle}
                name="arrow-right"
                size={20}
              />
              {renderDateTile("endDate", "Last delivery")}
            </View>
            {errors.endDate?.message ? (
              <Text style={styles.errorText}>{errors.endDate.message}</Text>
            ) : (
              <Text style={styles.helperText}>
                {rentalLengthDays > 0
                  ? `${rentalLengthDays} day${rentalLengthDays === 1 ? "" : "s"} of ice · pickup the day after`
                  : ""}
              </Text>
            )}
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Controller
                  control={control}
                  name="deliveryTime"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextField
                      icon="clock-outline"
                      label="First-day time · optional"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="3:00"
                      value={value}
                    />
                  )}
                />
              </View>
              <View style={styles.meridiem}>
                <Controller
                  control={control}
                  name="dayOrNight"
                  render={({ field: { onChange, value } }) => (
                    <SegmentedControl<DayOrNightOption>
                      accessibilityLabel="AM or PM"
                      onChange={onChange}
                      options={Object.values(DayOrNightOption).map(
                        (option) => ({
                          label: option,
                          value: option,
                        }),
                      )}
                      value={value}
                    />
                  )}
                />
              </View>
            </View>
          </>,
        )}

        {renderSection(
          "snowflake",
          "Ice",
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Cooler size</Text>
              <Controller
                control={control}
                name="coolerSize"
                render={({ field: { onChange, value } }) => (
                  <SegmentedControl<CoolerSizeOption>
                    accessibilityLabel="Cooler size"
                    onChange={onChange}
                    options={coolerSizeOptions}
                    value={value}
                  />
                )}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ice type</Text>
              <Controller
                control={control}
                name="iceType"
                render={({ field: { onChange, value } }) => (
                  <SegmentedControl<IceTypeOption>
                    accessibilityLabel="Ice type"
                    onChange={onChange}
                    options={iceTypeOptions}
                    value={value}
                  />
                )}
              />
            </View>
            <Controller
              control={control}
              name="coolerCount"
              render={({ field: { onChange, value } }) => (
                <Stepper
                  detail={
                    iceType === IceTypeOption.Bagged
                      ? `${getBagCount(coolerSize, coolerCount)} bags per delivery`
                      : "Filled with loose ice daily"
                  }
                  icon="package-variant-closed"
                  iconBackgroundColor={colors.primaryMuted}
                  iconColor={colors.primaryText}
                  label="Coolers"
                  max={20}
                  min={1}
                  onChange={onChange}
                  value={value}
                />
              )}
            />
          </>,
        )}

        {renderSection(
          "fruit-citrus",
          "Add-ons",
          <View style={styles.addonList}>
            {addonDefinitions.map((addon) => {
              const palette = colors.addon[addon.themeKey];

              return (
                <Controller
                  control={control}
                  key={addon.formField}
                  name={addon.formField}
                  render={({ field: { onChange, value } }) => (
                    <Stepper
                      icon={addon.icon}
                      iconBackgroundColor={palette.backgroundColor}
                      iconColor={palette.iconColor}
                      label={addon.label}
                      onChange={onChange}
                      value={value}
                    />
                  )}
                />
              );
            })}
          </View>,
        )}

        {renderSection(
          "cash",
          "Tip",
          <Controller
            control={control}
            name="tip"
            render={({ field: { onBlur, onChange, value } }) => (
              <>
                <TextField
                  error={errors.tip?.message}
                  inputStyle={styles.tipInput}
                  keyboardType="decimal-pad"
                  label="Amount"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="0.00"
                  prefix="$"
                  value={value}
                />
                <View style={styles.quickPickRow}>
                  {tipQuickPicks.map((amount) => {
                    const isSelected = value === amount;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={amount}
                        onPress={() => {
                          selectionHaptic();
                          onChange(amount);
                        }}
                        style={[
                          styles.quickPick,
                          isSelected
                            ? {
                                backgroundColor:
                                  colors.tone[ToneKey.Done].background,
                                borderColor: colors.tone[ToneKey.Done].accent,
                              }
                            : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickPickText,
                            isSelected
                              ? { color: colors.moneyText }
                              : undefined,
                          ]}
                        >
                          {amount === "0" ? "No tip" : `$${amount}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          />,
        )}

        {renderSection(
          "note-text-outline",
          "Notes for the driver",
          <Controller
            control={control}
            name="specialInstructions"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextField
                label="Special instructions · optional"
                multiline
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Gate code, where to leave the cooler…"
                value={value}
              />
            )}
          />,
        )}

        {submitError ? (
          <View style={styles.submitError}>
            <MaterialCommunityIcons
              color={colors.danger}
              name="alert-circle"
              size={20}
            />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        <Button
          icon="check"
          label={submitLabel}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          size="lg"
        />
      </ScrollView>

      <Sheet
        onClose={() => setIsNeighborhoodSheetOpen(false)}
        subtitle="Filled in automatically from most addresses"
        title="Neighborhood"
        visible={isNeighborhoodSheetOpen}
      >
        <ScrollView style={styles.neighborhoodList}>
          {neighborhoodData.map((option) => {
            const isSelected = option.value === neighborhood;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={option.value}
                onPress={() => {
                  selectionHaptic();
                  setValue("neighborhood", option.value, {
                    shouldValidate: true,
                  });
                  setIsNeighborhoodSheetOpen(false);
                }}
                style={[
                  styles.neighborhoodOption,
                  isSelected
                    ? { backgroundColor: colors.primaryMuted }
                    : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.neighborhoodText,
                    isSelected ? { color: colors.primaryText } : undefined,
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected ? (
                  <MaterialCommunityIcons
                    color={colors.primaryText}
                    name="check"
                    size={22}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
      {datePickerSheet}
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      gap: 12,
      paddingHorizontal: 16,
    },
    section: {
      gap: 14,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    sectionIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryMuted,
      borderRadius: Radius.sm,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      color: theme.colors.textMuted,
      fontSize: 13,
      fontWeight: "700",
    },
    pickerRow: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: Radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: "row",
      gap: 8,
      minHeight: 52,
      paddingHorizontal: 14,
    },
    pickerValue: {
      color: theme.colors.text,
      flex: 1,
      fontSize: 17,
    },
    detectedBadge: {
      alignItems: "center",
      borderRadius: Radius.pill,
      flexDirection: "row",
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    detectedText: {
      fontSize: 12,
      fontWeight: "800",
    },
    dateRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    dateTile: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: Radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    dateTileLabel: {
      color: theme.colors.textSubtle,
      fontSize: 12,
      fontWeight: "700",
    },
    dateTileValue: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 2,
    },
    helperText: {
      color: theme.colors.textSubtle,
      fontSize: 13,
      fontWeight: "500",
      marginTop: -6,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 13,
      fontWeight: "600",
    },
    timeRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: 10,
    },
    timeInput: {
      flex: 1,
    },
    meridiem: {
      width: 124,
    },
    addonList: {
      gap: 4,
    },
    tipInput: {
      fontSize: 22,
      fontWeight: "700",
    },
    quickPickRow: {
      flexDirection: "row",
      gap: 8,
    },
    quickPick: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      borderRadius: Radius.sm,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 44,
    },
    quickPickText: {
      color: theme.colors.textMuted,
      fontSize: 15,
      fontWeight: "700",
    },
    submitError: {
      alignItems: "center",
      backgroundColor: theme.colors.dangerMuted,
      borderRadius: Radius.md,
      flexDirection: "row",
      gap: 8,
      padding: 14,
    },
    submitErrorText: {
      color: theme.colors.danger,
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
    },
    neighborhoodList: {
      flexShrink: 1,
      marginHorizontal: -8,
    },
    neighborhoodOption: {
      alignItems: "center",
      borderRadius: Radius.md,
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: 52,
      paddingHorizontal: 12,
    },
    neighborhoodText: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "500",
    },
  });
