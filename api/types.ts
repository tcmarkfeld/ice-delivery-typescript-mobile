export interface Delivery {
  id: string | number;
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  special_instructions: string;
  cooler_size: string;
  ice_type: string;
  neighborhood: string;
  cooler_num: string | number;
  bag_limes: string | number;
  bag_lemons: string | number;
  bag_oranges: string | number;
  marg_salt: string | number;
  freeze_pops: string | number;
  tip: string | number;
  deliverytime?: string | null;
  dayornight?: string | null;
}

export type DeliveriesResponse = Delivery[];
export type TipReportResponse = string;

export interface CreateDeliveryInput {
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  start_date: string;
  end_date: string;
  special_instructions: string;
  cooler_size: string;
  ice_type: string;
  neighborhood: string;
  cooler_num: number;
  bag_limes: number;
  bag_lemons: number;
  bag_oranges: number;
  marg_salt: number;
  freeze_pops: number;
  tip: number;
  deliverytime: string;
  dayornight?: string;
}

export type LoginResponse =
  | string
  | {
      token?: string;
      authToken?: string;
      jwt?: string;
      message?: string;
      error?: string;
      data?: {
        token?: string;
        message?: string;
      };
    };
