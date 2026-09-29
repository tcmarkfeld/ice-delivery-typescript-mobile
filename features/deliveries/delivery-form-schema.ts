import { z } from "zod";

import { CreateDeliveryInput, Delivery } from "@/api/types";
import { sanitizeDateKey, toIsoDateKey } from "@/features/date/date-key-utils";
import { toCount } from "@/features/deliveries/delivery-utils";

export enum IceTypeOption {
  Loose = "Loose Ice",
  Bagged = "Bagged Ice",
}

export enum CoolerSizeOption {
  Quart40 = "40 Quart",
  Quart62 = "62 Quart",
  Quart200 = "Big Ass 200 Qt",
}

export enum DayOrNightOption {
  AM = "AM",
  PM = "PM",
}

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const deliveryFormSchema = z
  .object({
    customerName: z.string().trim().min(1, "Customer name is required."),
    phoneNumber: z.string().trim().min(1, "Phone is required."),
    deliveryAddress: z.string().trim().min(1, "Delivery address is required."),
    email: z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || z.email().safeParse(value).success,
        { message: "Enter a valid email." },
      ),
    specialInstructions: z.string().trim(),
    startDate: z.string().regex(dateKeyPattern, "Invalid start date."),
    endDate: z.string().regex(dateKeyPattern, "Invalid end date."),
    coolerSize: z.enum(CoolerSizeOption),
    iceType: z.enum(IceTypeOption),
    neighborhood: z.number().int().min(1, "Neighborhood is required."),
    coolerCount: z.number().int().min(1, "Coolers must be at least 1."),
    bagLimes: z.number().int().min(0),
    bagLemons: z.number().int().min(0),
    bagOranges: z.number().int().min(0),
    margSalt: z.number().int().min(0),
    freezePops: z.number().int().min(0),
    tip: z
      .string()
      .trim()
      .min(1, "Tip is required. Enter 0 if none.")
      .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid tip.")
      .transform(Number),
    deliveryTime: z.string().trim(),
    dayOrNight: z.enum(DayOrNightOption).optional(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

export type DeliveryFormInput = z.input<typeof deliveryFormSchema>;
export type DeliveryFormOutput = z.output<typeof deliveryFormSchema>;

export const getEmptyDeliveryFormValues = (): DeliveryFormInput => ({
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
  tip: "",
  deliveryTime: "",
  dayOrNight: undefined,
});

const findOption = <T extends string>(
  options: Record<string, T>,
  value: string,
  fallback: T,
): T => {
  const normalizedValue = value.trim().toLowerCase();

  return (
    Object.values(options).find(
      (option) => option.toLowerCase() === normalizedValue,
    ) ?? fallback
  );
};

export const getDeliveryFormValues = (
  delivery: Delivery,
): DeliveryFormInput => {
  const tipAmount = Number.parseFloat(
    String(delivery.tip).replace(/[^0-9.]/g, ""),
  );

  return {
    customerName: delivery.customer_name ?? "",
    phoneNumber: delivery.customer_phone ?? "",
    deliveryAddress: delivery.delivery_address ?? "",
    email: delivery.customer_email ?? "",
    specialInstructions: delivery.special_instructions ?? "",
    startDate: sanitizeDateKey(delivery.start_date),
    endDate: sanitizeDateKey(delivery.end_date),
    coolerSize: findOption(
      CoolerSizeOption,
      String(delivery.cooler_size),
      CoolerSizeOption.Quart62,
    ),
    iceType: findOption(
      IceTypeOption,
      String(delivery.ice_type),
      IceTypeOption.Loose,
    ),
    neighborhood: toCount(delivery.neighborhood),
    coolerCount: toCount(delivery.cooler_num),
    bagLimes: toCount(delivery.bag_limes),
    bagLemons: toCount(delivery.bag_lemons),
    bagOranges: toCount(delivery.bag_oranges),
    margSalt: toCount(delivery.marg_salt),
    freezePops: toCount(delivery.freeze_pops),
    tip: Number.isNaN(tipAmount) ? "0" : String(tipAmount),
    deliveryTime: String(delivery.deliverytime ?? ""),
    dayOrNight: Object.values(DayOrNightOption).find(
      (option) => option === String(delivery.dayornight ?? "").trim(),
    ),
  };
};

export const toDeliveryPayload = (
  values: DeliveryFormOutput,
): CreateDeliveryInput => ({
  customer_name: values.customerName,
  customer_phone: values.phoneNumber,
  delivery_address: values.deliveryAddress,
  customer_email: values.email,
  special_instructions: values.specialInstructions,
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
  deliverytime: values.deliveryTime,
  dayornight: values.dayOrNight,
});

export const formatPhoneNumber = (rawValue: string): string => {
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 10);

  if (digitsOnly.length <= 3) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  }

  return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
};
