import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useAllDeliveriesQuery } from '@/api/queries/use-deliveries-query';
import { useUpdateDeliveryMutation } from '@/api/queries/use-update-delivery-mutation';
import { ApiQueryKey } from '@/api/query-keys';
import { CreateDeliveryInput, Delivery } from '@/api/types';
import { parseIsoDateKey, sanitizeDateKey, toIsoDateKey } from '@/features/date/date-key-utils';
import { neighborhoodData } from '@/features/neighborhood/constants';
import {
  detectNeighborhoodFromAddress,
  NeighborhoodOption,
} from '@/features/neighborhood/detect-neighborhood';
import { toCount } from '@/features/deliveries/delivery-utils';
import { useSession } from '@/hooks/use-session';

enum IceTypeOption {
  Loose = 'Loose Ice',
  Bagged = 'Bagged Ice',
}

enum CoolerSizeOption {
  Quart40 = '40 Quart',
  Quart62 = '62 Quart',
  Quart200 = 'Big Ass 200 Qt',
}

enum DayOrNightOption {
  AM = 'AM',
  PM = 'PM',
}

enum DateField {
  StartDate = 'startDate',
  EndDate = 'endDate',
}

const formatPhoneNumber = (rawValue: string): string => {
  const digitsOnly = rawValue.replace(/\D/g, '').slice(0, 10);

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

const editDeliverySchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required.'),
  phoneNumber: z.string().trim().min(1, 'Phone is required.'),
  deliveryAddress: z.string().trim().min(1, 'Delivery address is required.'),
  email: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
      message: 'Enter a valid email.',
    }),
  specialInstructions: z.string().trim(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date.'),
  coolerSize: z.enum(CoolerSizeOption),
  iceType: z.enum(IceTypeOption),
  neighborhood: z.number().int().min(1, 'Neighborhood is required.'),
  coolerCount: z.coerce.number().int().min(1, 'Coolers must be at least 1.'),
  bagLimes: z.coerce.number().int().min(0),
  bagLemons: z.coerce.number().int().min(0),
  bagOranges: z.coerce.number().int().min(0),
  margSalt: z.coerce.number().int().min(0),
  freezePops: z.coerce.number().int().min(0),
  tip: z.coerce.number().min(0),
  deliveryTime: z.string().trim(),
  dayOrNight: z.enum(DayOrNightOption).optional(),
});

type EditDeliveryFormInput = z.input<typeof editDeliverySchema>;
type EditDeliveryFormOutput = z.output<typeof editDeliverySchema>;
const allDeliveriesRoute = '/(tabs)/all-deliveries';

const normalizeOptionValue = (value: string): string => value.trim().toLowerCase();

const getCoolerSizeOption = (value: string): CoolerSizeOption => {
  const normalizedValue = normalizeOptionValue(value);

  if (normalizedValue === normalizeOptionValue(CoolerSizeOption.Quart40)) {
    return CoolerSizeOption.Quart40;
  }

  if (normalizedValue === normalizeOptionValue(CoolerSizeOption.Quart200)) {
    return CoolerSizeOption.Quart200;
  }

  return CoolerSizeOption.Quart62;
};

const getIceTypeOption = (value: string): IceTypeOption => {
  const normalizedValue = normalizeOptionValue(value);

  if (normalizedValue === normalizeOptionValue(IceTypeOption.Bagged)) {
    return IceTypeOption.Bagged;
  }

  return IceTypeOption.Loose;
};

const getDefaultValuesFromDelivery = (delivery: Delivery): EditDeliveryFormInput => {
  const dayOrNightValue = String(delivery.dayornight ?? '').trim() as DayOrNightOption;

  return {
    customerName: delivery.customer_name ?? '',
    phoneNumber: delivery.customer_phone ?? '',
    deliveryAddress: delivery.delivery_address ?? '',
    email: delivery.customer_email ?? '',
    specialInstructions: delivery.special_instructions ?? '',
    startDate: sanitizeDateKey(delivery.start_date),
    endDate: sanitizeDateKey(delivery.end_date),
    coolerSize: getCoolerSizeOption(String(delivery.cooler_size)),
    iceType: getIceTypeOption(String(delivery.ice_type)),
    neighborhood: toCount(delivery.neighborhood),
    coolerCount: toCount(delivery.cooler_num),
    bagLimes: toCount(delivery.bag_limes),
    bagLemons: toCount(delivery.bag_lemons),
    bagOranges: toCount(delivery.bag_oranges),
    margSalt: toCount(delivery.marg_salt),
    freezePops: toCount(delivery.freeze_pops),
    tip: toCount(delivery.tip),
    deliveryTime: String(delivery.deliverytime ?? ''),
    dayOrNight:
      dayOrNightValue === DayOrNightOption.AM || dayOrNightValue === DayOrNightOption.PM
        ? dayOrNightValue
        : undefined,
  };
};

const renderFieldError = (message?: string) => (message ? <Text style={styles.errorText}>{message}</Text> : null);

export default function EditDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { authToken } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const deliveriesQuery = useAllDeliveriesQuery(authToken);
  const updateDeliveryMutation = useUpdateDeliveryMutation();
  const [activeDateField, setActiveDateField] = useState<DateField | null>(null);
  const [isNeighborhoodMenuOpen, setIsNeighborhoodMenuOpen] = useState<boolean>(false);

  const selectedDelivery = useMemo(() => {
    if (!id || !deliveriesQuery.data) {
      return null;
    }

    return deliveriesQuery.data.find((item) => String(item.id) === String(id)) ?? null;
  }, [deliveriesQuery.data, id]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<EditDeliveryFormInput, undefined, EditDeliveryFormOutput>({
    resolver: zodResolver(editDeliverySchema),
    defaultValues: selectedDelivery ? getDefaultValuesFromDelivery(selectedDelivery) : undefined,
  });

  const startDateValue = watch('startDate');
  const endDateValue = watch('endDate');
  const deliveryAddressValue = watch('deliveryAddress');
  const neighborhoodValue = watch('neighborhood');
  const selectedNeighborhoodOption = useMemo<NeighborhoodOption | undefined>(() => {
    return neighborhoodData.find((option) => option.value === neighborhoodValue);
  }, [neighborhoodValue]);
  const selectedDateValue =
    activeDateField === DateField.EndDate ? parseIsoDateKey(endDateValue) : parseIsoDateKey(startDateValue);

  useEffect(() => {
    if (!selectedDelivery) {
      return;
    }

    reset(getDefaultValuesFromDelivery(selectedDelivery));
  }, [reset, selectedDelivery]);

  useEffect(() => {
    const detectedNeighborhood = detectNeighborhoodFromAddress(deliveryAddressValue);

    if (detectedNeighborhood && neighborhoodValue !== detectedNeighborhood.value) {
      setValue('neighborhood', detectedNeighborhood.value, { shouldValidate: true });
    }
  }, [deliveryAddressValue, neighborhoodValue, setValue]);

  if (deliveriesQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.centeredScreen]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!selectedDelivery || !id) {
    return (
      <View style={[styles.screen, styles.centeredScreen]}>
        <Text style={styles.errorText}>Delivery not found.</Text>
        <Pressable onPress={() => router.push(allDeliveriesRoute)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate || !activeDateField) {
      setActiveDateField(null);
      return;
    }

    const isoDate = toIsoDateKey(selectedDate);

    if (activeDateField === DateField.StartDate) {
      setValue('startDate', isoDate, { shouldValidate: true });
    }

    if (activeDateField === DateField.EndDate) {
      setValue('endDate', isoDate, { shouldValidate: true });
    }

    if (Platform.OS === 'android') {
      setActiveDateField(null);
    }
  };

  const openDatePicker = (field: DateField) => {
    if (Platform.OS === 'android') {
      setActiveDateField(field);
      DateTimePickerAndroid.open({
        mode: 'date',
        value: parseIsoDateKey(field === DateField.StartDate ? startDateValue : endDateValue),
        onChange: (event, date) => onDateChange(event, date),
      });
      return;
    }

    setActiveDateField(field);
  };

  const onSubmit = async (values: EditDeliveryFormOutput) => {
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

    await updateDeliveryMutation.mutateAsync({
      id: String(id),
      payload,
      token: authToken,
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [ApiQueryKey.DeliveriesToday] }),
      queryClient.invalidateQueries({ queryKey: [ApiQueryKey.DeliveriesAll] }),
      queryClient.invalidateQueries({ queryKey: [ApiQueryKey.DeliveriesByDateRange] }),
    ]);

    reset(values);
    router.push(allDeliveriesRoute);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push(allDeliveriesRoute)} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.pageTitle}>Edit Delivery</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Customer Name</Text>
          <Controller
            control={control}
            name="customerName"
            render={({ field: { onChange, value } }) => (
              <TextInput onChangeText={onChange} style={styles.input} value={value} />
            )}
          />
          {renderFieldError(errors.customerName?.message)}

          <Text style={styles.fieldLabel}>Phone</Text>
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                keyboardType="phone-pad"
                onChangeText={(nextValue) => onChange(formatPhoneNumber(nextValue))}
                style={styles.input}
                value={value}
              />
            )}
          />
          {renderFieldError(errors.phoneNumber?.message)}

          <Text style={styles.fieldLabel}>Delivery Address</Text>
          <Controller
            control={control}
            name="deliveryAddress"
            render={({ field: { onChange, value } }) => (
              <TextInput onChangeText={onChange} style={styles.input} value={value} />
            )}
          />
          {renderFieldError(errors.deliveryAddress?.message)}

          <Text style={styles.fieldLabel}>Start Date</Text>
          <Pressable onPress={() => openDatePicker(DateField.StartDate)} style={[styles.input, styles.dateSelector]}>
            <Text style={styles.dateSelectorText}>{startDateValue}</Text>
          </Pressable>
          {renderFieldError(errors.startDate?.message)}

          <Text style={styles.fieldLabel}>End Date</Text>
          <Pressable onPress={() => openDatePicker(DateField.EndDate)} style={[styles.input, styles.dateSelector]}>
            <Text style={styles.dateSelectorText}>{endDateValue}</Text>
          </Pressable>
          {renderFieldError(errors.endDate?.message)}

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
                    style={[styles.choiceButton, value === option ? styles.choiceButtonActive : undefined]}>
                    <Text
                      style={[
                        styles.choiceButtonText,
                        value === option ? styles.choiceButtonTextActive : undefined,
                      ]}>
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
                    style={[styles.choiceButton, value === option ? styles.choiceButtonActive : undefined]}>
                    <Text
                      style={[
                        styles.choiceButtonText,
                        value === option ? styles.choiceButtonTextActive : undefined,
                      ]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />

          <Text style={styles.fieldLabel}>Neighborhood</Text>
          <Controller
            control={control}
            name="neighborhood"
            render={({ field: { onChange } }) => (
              <View style={styles.dropdownContainer}>
                <Pressable
                  onPress={() => setIsNeighborhoodMenuOpen((currentValue) => !currentValue)}
                  style={[styles.input, styles.dropdownButton]}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedNeighborhoodOption?.label ?? 'Select neighborhood...'}
                  </Text>
                </Pressable>

                {isNeighborhoodMenuOpen ? (
                  <View style={styles.dropdownMenu}>
                    <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                      {neighborhoodData.map((option) => (
                        <Pressable
                          key={`${option.value}`}
                          onPress={() => {
                            onChange(option.value);
                            setIsNeighborhoodMenuOpen(false);
                          }}
                          style={styles.dropdownItem}>
                          <Text style={styles.dropdownItemText}>{option.label}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            )}
          />
          {renderFieldError(errors.neighborhood?.message)}

          <View style={styles.doubleRow}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Coolers</Text>
              <Controller
                control={control}
                name="coolerCount"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Tip</Text>
              <Controller
                control={control}
                name="tip"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.doubleRow}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Bag Limes</Text>
              <Controller
                control={control}
                name="bagLimes"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Bag Lemons</Text>
              <Controller
                control={control}
                name="bagLemons"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.doubleRow}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Bag Oranges</Text>
              <Controller
                control={control}
                name="bagOranges"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Marg Salt</Text>
              <Controller
                control={control}
                name="margSalt"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.doubleRow}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Freeze Pops</Text>
              <Controller
                control={control}
                name="freezePops"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(nextValue) => onChange(Number.parseInt(nextValue || '0', 10) || 0)}
                    style={styles.input}
                    value={String(value)}
                  />
                )}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>Delivery Time</Text>
              <Controller
                control={control}
                name="deliveryTime"
                render={({ field: { onChange, value } }) => (
                  <TextInput onChangeText={onChange} style={styles.input} value={value} />
                )}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Special Instructions</Text>
          <Controller
            control={control}
            name="specialInstructions"
            render={({ field: { onChange, value } }) => (
              <TextInput multiline onChangeText={onChange} style={[styles.input, styles.textArea]} value={value} />
            )}
          />
        </View>

        {updateDeliveryMutation.error ? (
          <Text style={styles.errorText}>{updateDeliveryMutation.error.message}</Text>
        ) : null}

        <Pressable
          disabled={updateDeliveryMutation.isPending}
          onPress={handleSubmit(onSubmit)}
          style={styles.submitButton}>
          {updateDeliveryMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>

      {Platform.OS === 'ios' ? (
        <Modal animationType="slide" presentationStyle="overFullScreen" transparent visible={activeDateField !== null}>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>Select Date</Text>
                <Pressable onPress={() => setActiveDateField(null)} style={styles.dateModalDoneButton}>
                  <Text style={styles.dateModalDoneText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                display="inline"
                mode="date"
                onChange={onDateChange}
                themeVariant="light"
                value={selectedDateValue}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f3f7fb',
    flex: 1,
  },
  content: {
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    borderColor: '#0a7ea4',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#0a7ea4',
    fontSize: 12,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe5ef',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe5ef',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateSelector: {
    justifyContent: 'center',
  },
  dateSelectorText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  dropdownButton: {
    justifyContent: 'center',
    marginBottom: 0,
  },
  dropdownButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe5ef',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemText: {
    color: '#334155',
    fontSize: 14,
  },
  rowGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  choiceButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe5ef',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  choiceButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#0a7ea4',
  },
  choiceButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  choiceButtonTextActive: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  doubleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  dateModalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  dateModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateModalTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  dateModalDoneButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateModalDoneText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
