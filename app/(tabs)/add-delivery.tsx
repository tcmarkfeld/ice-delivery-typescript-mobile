import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { useCreateDeliveryMutation } from "@/api/queries/use-create-delivery-mutation";
import { ApiQueryKey } from "@/api/query-keys";
import { CreateDeliveryInput } from "@/api/types";
import { AppTheme } from "@/constants/theme";
import {
  addDaysToDateKey,
  parseIsoDateKey,
  toIsoDateKey,
} from "@/features/date/date-key-utils";
import { neighborhoodData } from "@/features/neighborhood/constants";
import { detectNeighborhoodFromAddress } from "@/features/neighborhood/detect-neighborhood";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useSession } from "@/hooks/use-session";

enum IceTypeOption {
  Loose = "Loose Ice",
  Bagged = "Bagged Ice",
}

enum CoolerSizeOption {
  Quart40 = "40 Quart",
  Quart62 = "62 Quart",
  Quart200 = "Big Ass 200 Qt",
}

enum DayOrNightOption {
  AM = "AM",
  PM = "PM",
}

enum DateField {
  StartDate = "startDate",
  EndDate = "endDate",
}

const defaultDeliveryDurationDays = 6;

const addDeliverySchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  phoneNumber: z.string().trim().min(1, "Phone is required."),
  deliveryAddress: z.string().trim().min(1, "Delivery address is required."),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      {
        message: "Enter a valid email.",
      },
    ),
  specialInstructions: z.string().trim(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date."),
  coolerSize: z.enum(CoolerSizeOption),
  iceType: z.enum(IceTypeOption),
  neighborhood: z.number().int().min(1, "Neighborhood is required."),
  coolerCount: z.coerce.number().int().min(1, "Coolers must be at least 1."),
  bagLimes: z.coerce.number().int().min(0),
  bagLemons: z.coerce.number().int().min(0),
  bagOranges: z.coerce.number().int().min(0),
  margSalt: z.coerce.number().int().min(0),
  freezePops: z.coerce.number().int().min(0),
  tip: z.coerce.number().min(0),
  deliveryTime: z.string().trim(),
  dayOrNight: z.enum(DayOrNightOption).optional(),
});

type AddDeliveryFormInput = z.input<typeof addDeliverySchema>;
type AddDeliveryFormOutput = z.output<typeof addDeliverySchema>;

const addDeliveryDefaultValues: AddDeliveryFormInput = {
  customerName: "",
  phoneNumber: "",
  deliveryAddress: "",
  email: "",
  specialInstructions: "",
  startDate: toIsoDateKey(new Date()),
  endDate: toIsoDateKey(new Date()),
  coolerSize: CoolerSizeOption.Quart62,
  iceType: IceTypeOption.Loose,
  neighborhood: 1,
  coolerCount: 1,
  bagLimes: 0,
  bagLemons: 0,
  bagOranges: 0,
  margSalt: 0,
  freezePops: 0,
  tip: 0,
  deliveryTime: "",
  dayOrNight: undefined,
};

const renderFieldError = (
  message: string | undefined,
  styles: ReturnType<typeof createStyles>,
) => {
  if (!message) {
    return null;
  }

  return <Text style={styles.errorText}>{message}</Text>;
};

const formatPhoneNumber = (rawValue: string): string => {
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 10);

  if (digitsOnly.length <= 3) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 6) {
    const areaCode = digitsOnly.slice(0, 3);
    const prefix = digitsOnly.slice(3);
    return `(${areaCode}) ${prefix}`;
  }

  const areaCode = digitsOnly.slice(0, 3);
  const prefix = digitsOnly.slice(3, 6);
  const lineNumber = digitsOnly.slice(6);
  return `(${areaCode}) ${prefix}-${lineNumber}`;
};

export default function AddDeliveryScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { authToken } = useSession();

  const createDeliveryMutation = useCreateDeliveryMutation();
  const formPlaceholderTextColor = theme.colors.textSubtle;

  const [activeDateField, setActiveDateField] = useState<DateField | null>(
    null,
  );
  const [isNeighborhoodMenuOpen, setIsNeighborhoodMenuOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddDeliveryFormInput, undefined, AddDeliveryFormOutput>({
    resolver: zodResolver(addDeliverySchema),
    defaultValues: addDeliveryDefaultValues,
  });

  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");
  const deliveryAddressValue = watch("deliveryAddress");
  const neighborhoodValue = watch("neighborhood");
  const selectedNeighborhoodOption = useMemo(() => {
    return neighborhoodData.find(
      (option) => option.value === neighborhoodValue,
    );
  }, [neighborhoodValue]);
  const selectedDateValue =
    activeDateField === DateField.EndDate
      ? parseIsoDateKey(endDateValue)
      : parseIsoDateKey(startDateValue);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate || !activeDateField) {
      setActiveDateField(null);
      return;
    }

    const isoDate = toIsoDateKey(selectedDate);

    if (activeDateField === DateField.StartDate) {
      setValue("startDate", isoDate, { shouldValidate: true });
      setValue(
        "endDate",
        addDaysToDateKey(isoDate, defaultDeliveryDurationDays),
        {
          shouldValidate: true,
        },
      );
    }

    if (activeDateField === DateField.EndDate) {
      setValue("endDate", isoDate, { shouldValidate: true });
    }

    if (Platform.OS === "android") {
      setActiveDateField(null);
    }
  };

  const openDatePicker = (field: DateField) => {
    if (Platform.OS === "android") {
      setActiveDateField(field);
      DateTimePickerAndroid.open({
        mode: "date",
        value: parseIsoDateKey(
          field === DateField.StartDate ? startDateValue : endDateValue,
        ),
        onChange: (event, date) => onDateChange(event, date),
      });
      return;
    }

    setActiveDateField(field);
  };

  const onSubmit = async (values: AddDeliveryFormOutput) => {
    if (!authToken) {
      return;
    }

    const payload: CreateDeliveryInput = {
      customer_name: values.customerName.trim(),
      customer_phone: values.phoneNumber.trim(),
      delivery_address: values.deliveryAddress.trim(),
      customer_email: values.email.trim(),
      special_instructions: values.specialInstructions.trim(),
      start_date: values.startDate,
      end_date: values.endDate,
      cooler_size: values.coolerSize,
      ice_type: values.iceType,
      neighborhood: String(values.neighborhood),
      cooler_num: values.coolerCount,
      bag_limes: values.bagLimes,
      bag_lemons: values.bagLemons,
      bag_oranges: values.bagOranges,
      marg_salt: values.margSalt,
      freeze_pops: values.freezePops,
      tip: values.tip,
      deliverytime: values.deliveryTime.trim(),
      dayornight: values.dayOrNight,
    };

    try {
      await createDeliveryMutation.mutateAsync({
        payload,
        token: authToken,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [ApiQueryKey.DeliveriesToday],
        }),
        queryClient.invalidateQueries({
          queryKey: [ApiQueryKey.DeliveriesAll],
        }),
      ]);

      reset({
        ...addDeliveryDefaultValues,
        startDate: toIsoDateKey(new Date()),
        endDate: toIsoDateKey(new Date()),
      });
      setActiveDateField(null);
      setIsNeighborhoodMenuOpen(false);

      router.replace("/(tabs)");
    } catch {
      // Handled by mutation error rendering
    }
  };

  useEffect(() => {
    const detectedNeighborhood =
      detectNeighborhoodFromAddress(deliveryAddressValue);

    if (
      detectedNeighborhood &&
      neighborhoodValue !== detectedNeighborhood.value
    ) {
      setValue("neighborhood", detectedNeighborhood.value, {
        shouldValidate: true,
      });
    }
  }, [deliveryAddressValue, neighborhoodValue, setValue]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { paddingTop: insets.top + 8 }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Add Delivery</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Customer</Text>

          <Text style={styles.fieldLabel}>Customer Name</Text>
          <Controller
            control={control}
            name="customerName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                onChangeText={onChange}
                placeholder="Customer name"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={value}
              />
            )}
          />
          {renderFieldError(errors.customerName?.message, styles)}

          <Text style={styles.fieldLabel}>Phone</Text>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                keyboardType="phone-pad"
                onChangeText={(nextValue) =>
                  onChange(formatPhoneNumber(nextValue))
                }
                placeholder="Phone"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={value}
              />
            )}
          />
          {renderFieldError(errors.phoneNumber?.message, styles)}

          <Text style={styles.fieldLabel}>Delivery Address</Text>
          <Controller
            control={control}
            name="deliveryAddress"
            render={({ field: { onChange, value } }) => (
              <TextInput
                onChangeText={onChange}
                placeholder="Delivery address"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={value}
              />
            )}
          />
          {renderFieldError(errors.deliveryAddress?.message, styles)}

          <Text style={styles.fieldLabel}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={onChange}
                placeholder="Email (optional)"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={value}
              />
            )}
          />
          {renderFieldError(errors.email?.message, styles)}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <Text style={[styles.fieldLabel, styles.priorityFieldLabel]}>
            Start Date
          </Text>
          <Pressable
            onPress={() => openDatePicker(DateField.StartDate)}
            style={[
              styles.input,
              styles.dateSelector,
              styles.priorityDateInput,
            ]}
          >
            <Text style={[styles.dateSelectorText, styles.priorityDateText]}>
              {startDateValue}
            </Text>
          </Pressable>
          {renderFieldError(errors.startDate?.message, styles)}

          <Text style={[styles.fieldLabel, styles.priorityFieldLabel]}>
            End Date
          </Text>
          <Pressable
            onPress={() => openDatePicker(DateField.EndDate)}
            style={[
              styles.input,
              styles.dateSelector,
              styles.priorityDateInput,
            ]}
          >
            <Text style={[styles.dateSelectorText, styles.priorityDateText]}>
              {endDateValue}
            </Text>
          </Pressable>
          {renderFieldError(errors.endDate?.message, styles)}

          <Text style={styles.fieldLabel}>
            Delivery Time First Day (Optional)
          </Text>
          <Controller
            control={control}
            name="deliveryTime"
            render={({ field: { onChange, value } }) => (
              <TextInput
                onChangeText={onChange}
                placeholder="Delivery time (optional)"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={value}
              />
            )}
          />

          <Text style={styles.fieldLabel}>AM / PM (Optional)</Text>
          <Controller
            control={control}
            name="dayOrNight"
            render={({ field: { onChange, value } }) => (
              <View style={styles.rowGroup}>
                {Object.values(DayOrNightOption).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    style={[
                      styles.choiceButton,
                      value === option ? styles.choiceButtonActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceButtonText,
                        value === option
                          ? styles.choiceButtonTextActive
                          : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order</Text>

          <Text style={styles.fieldLabel}>Neighborhood</Text>
          <Controller
            control={control}
            name="neighborhood"
            render={({ field: { onChange } }) => (
              <View style={styles.dropdownContainer}>
                <Pressable
                  onPress={() =>
                    setIsNeighborhoodMenuOpen((currentValue) => !currentValue)
                  }
                  style={[styles.input, styles.dropdownButton]}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedNeighborhoodOption?.label ??
                      "Select neighborhood..."}
                  </Text>
                </Pressable>

                {isNeighborhoodMenuOpen ? (
                  <View style={styles.dropdownMenu}>
                    <ScrollView
                      nestedScrollEnabled
                      style={styles.dropdownScroll}
                    >
                      {neighborhoodData.map((option) => (
                        <Pressable
                          key={`${option.value}`}
                          onPress={() => {
                            onChange(option.value);
                            setIsNeighborhoodMenuOpen(false);
                          }}
                          style={styles.dropdownItem}
                        >
                          <Text style={styles.dropdownItemText}>
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            )}
          />
          {renderFieldError(errors.neighborhood?.message, styles)}

          <Text style={styles.fieldLabel}>Number of Coolers</Text>
          <Controller
            control={control}
            name="coolerCount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                keyboardType="number-pad"
                onChangeText={(nextValue) =>
                  onChange(Number.parseInt(nextValue || "0", 10) || 0)
                }
                placeholder="Number of coolers"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={String(value)}
              />
            )}
          />
          {renderFieldError(errors.coolerCount?.message, styles)}

          <Text style={styles.fieldLabel}>Cooler Size</Text>
          <Controller
            control={control}
            name="coolerSize"
            render={({ field: { onChange, value } }) => (
              <View style={styles.rowGroup}>
                {Object.values(CoolerSizeOption).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    style={[
                      styles.choiceButton,
                      value === option ? styles.choiceButtonActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceButtonText,
                        value === option
                          ? styles.choiceButtonTextActive
                          : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <Text style={styles.fieldLabel}>Ice Type</Text>
          <Controller
            control={control}
            name="iceType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.rowGroup}>
                {Object.values(IceTypeOption).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    style={[
                      styles.choiceButton,
                      value === option ? styles.choiceButtonActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceButtonText,
                        value === option
                          ? styles.choiceButtonTextActive
                          : undefined,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <View style={styles.doubleLabelRow}>
            <Text style={[styles.fieldLabel, styles.halfLabel]}>Bag Limes</Text>
            <Text style={[styles.fieldLabel, styles.halfLabel]}>
              Bag Lemons
            </Text>
          </View>
          <View style={styles.doubleRow}>
            <Controller
              control={control}
              name="bagLimes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(nextValue) =>
                    onChange(Number.parseInt(nextValue || "0", 10) || 0)
                  }
                  placeholder="Limes"
                  placeholderTextColor={formPlaceholderTextColor}
                  style={[styles.input, styles.halfInput]}
                  value={String(value)}
                />
              )}
            />
            <Controller
              control={control}
              name="bagLemons"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(nextValue) =>
                    onChange(Number.parseInt(nextValue || "0", 10) || 0)
                  }
                  placeholder="Lemons"
                  placeholderTextColor={formPlaceholderTextColor}
                  style={[styles.input, styles.halfInput]}
                  value={String(value)}
                />
              )}
            />
          </View>

          <View style={styles.doubleLabelRow}>
            <Text style={[styles.fieldLabel, styles.halfLabel]}>
              Bag Oranges
            </Text>
            <Text style={[styles.fieldLabel, styles.halfLabel]}>Marg Salt</Text>
          </View>
          <View style={styles.doubleRow}>
            <Controller
              control={control}
              name="bagOranges"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(nextValue) =>
                    onChange(Number.parseInt(nextValue || "0", 10) || 0)
                  }
                  placeholder="Oranges"
                  placeholderTextColor={formPlaceholderTextColor}
                  style={[styles.input, styles.halfInput]}
                  value={String(value)}
                />
              )}
            />
            <Controller
              control={control}
              name="margSalt"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(nextValue) =>
                    onChange(Number.parseInt(nextValue || "0", 10) || 0)
                  }
                  placeholder="Marg salt"
                  placeholderTextColor={formPlaceholderTextColor}
                  style={[styles.input, styles.halfInput]}
                  value={String(value)}
                />
              )}
            />
          </View>

          <Text style={styles.fieldLabel}>Freeze Pops</Text>
          <Controller
            control={control}
            name="freezePops"
            render={({ field: { onChange, value } }) => (
              <TextInput
                keyboardType="number-pad"
                onChangeText={(nextValue) =>
                  onChange(Number.parseInt(nextValue || "0", 10) || 0)
                }
                placeholder="Freeze pops"
                placeholderTextColor={formPlaceholderTextColor}
                style={styles.input}
                value={String(value)}
              />
            )}
          />

          <View style={styles.tipHighlightCard}>
            <Text style={styles.tipHighlightTitle}>Tip</Text>
            <Controller
              control={control}
              name="tip"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(nextValue) =>
                    onChange(Number.parseInt(nextValue || "0", 10) || 0)
                  }
                  placeholder="Tip amount"
                  placeholderTextColor={formPlaceholderTextColor}
                  style={[styles.input, styles.tipHighlightInput]}
                  value={String(value)}
                />
              )}
            />
          </View>

          <Text style={styles.fieldLabel}>Special Instructions</Text>
          <Controller
            control={control}
            name="specialInstructions"
            render={({ field: { onChange, value } }) => (
              <TextInput
                multiline
                onChangeText={onChange}
                placeholder="Special instructions"
                placeholderTextColor={formPlaceholderTextColor}
                style={[styles.input, styles.textArea]}
                value={value}
              />
            )}
          />
        </View>

        {createDeliveryMutation.error ? (
          <Text style={styles.errorText}>
            {createDeliveryMutation.error.message}
          </Text>
        ) : null}

        <Pressable
          disabled={createDeliveryMutation.isPending}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitButton}
        >
          {createDeliveryMutation.isPending ? (
            <ActivityIndicator color={theme.colors.iconOnPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>Create Delivery</Text>
          )}
        </Pressable>
      </ScrollView>

      {Platform.OS === "ios" ? (
        <Modal
          animationType="slide"
          presentationStyle="overFullScreen"
          transparent
          visible={activeDateField !== null}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>Select Date</Text>
                <Pressable
                  onPress={() => setActiveDateField(null)}
                  style={styles.dateModalDoneButton}
                >
                  <Text style={styles.dateModalDoneText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                display="inline"
                mode="date"
                onChange={onDateChange}
                themeVariant={theme.datePickerVariant}
                value={selectedDateValue}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.screen,
    flex: 1,
  },
  content: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 4,
  },
  pageTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  priorityFieldLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  inlineLabel: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: theme.colors.text,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateSelector: {
    justifyContent: "center",
  },
  dateSelectorText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  priorityDateInput: {
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  priorityDateText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  dropdownButton: {
    justifyContent: "center",
    marginBottom: 0,
  },
  dropdownButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownMenu: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    maxHeight: 220,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  dateModalOverlay: {
    backgroundColor: theme.colors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  dateModalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  dateModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateModalTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  dateModalDoneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateModalDoneText: {
    color: theme.colors.iconOnPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  textArea: {
    minHeight: 78,
    textAlignVertical: "top",
  },
  rowGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  choiceButton: {
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  choiceButtonActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  choiceButtonText: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: "600",
  },
  choiceButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  doubleRow: {
    flexDirection: "row",
    gap: 8,
  },
  doubleLabelRow: {
    flexDirection: "row",
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  halfLabel: {
    flex: 1,
  },
  tipHighlightCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.tileEmphasisBorder,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: 0,
    padding: 8,
  },
  tipHighlightTitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  tipHighlightInput: {
    backgroundColor: theme.colors.inputBackground,
    borderColor: theme.colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 0,
    minHeight: 44,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    marginTop: 4,
    paddingVertical: 12,
  },
  submitButtonText: {
    color: theme.colors.iconOnPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
