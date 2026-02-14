import { Delivery } from '@/api/types';
import { addDaysToDateKey } from '@/features/date/date-key-utils';

export enum IceType {
  Bagged = 'bagged ice',
  Loose = 'loose ice',
}

export enum CoolerSize {
  Quart40 = '40 quart',
  Quart62 = '62 quart',
  Quart200 = 'big ass 200 qt',
}

export enum BusinessTimeZone {
  Eastern = 'America/New_York',
}

export interface DeliverySummary {
  bagged40Count: number;
  bagged62Count: number;
  bagged200Count: number;
  loose40Count: number;
  loose62Count: number;
  totalIceBags: number;
  bagLimes: number;
  bagLemons: number;
  bagOranges: number;
  margaritaSalt: number;
  freezePops: number;
}

const bagMultiplierByCoolerSize: Record<CoolerSize, number> = {
  [CoolerSize.Quart40]: 1,
  [CoolerSize.Quart62]: 2,
  [CoolerSize.Quart200]: 8,
};

const toLowerTrimmed = (value: string): string => value.trim().toLowerCase();

export const toCount = (value: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

export const getDateKeyFromIso = (isoDateString: string): string => {
  return isoDateString.slice(0, 10);
};

export const getBusinessDateKey = (offsetDays = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BusinessTimeZone.Eastern,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';

  return `${year}-${month}-${day}`;
};

const getAddressHouseNumber = (address: string): number => {
  const houseNumberMatch = address.match(/\d+/);

  if (!houseNumberMatch) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number.parseInt(houseNumberMatch[0], 10);
};

const getNeighborhoodNumber = (neighborhood: string): number => {
  const parsedValue = Number.parseInt(neighborhood, 10);
  return Number.isNaN(parsedValue) ? Number.MAX_SAFE_INTEGER : parsedValue;
};

export const sortDeliveries = (deliveries: Delivery[]): Delivery[] => {
  return [...deliveries].sort((left, right) => {
    const neighborhoodDifference =
      getNeighborhoodNumber(left.neighborhood) - getNeighborhoodNumber(right.neighborhood);

    if (neighborhoodDifference !== 0) {
      return neighborhoodDifference;
    }

    const houseNumberDifference =
      getAddressHouseNumber(left.delivery_address) - getAddressHouseNumber(right.delivery_address);

    if (houseNumberDifference !== 0) {
      return houseNumberDifference;
    }

    return left.delivery_address.localeCompare(right.delivery_address);
  });
};

export const buildDeliverySummary = (
  deliveries: Delivery[],
  todayDateKey: string
): DeliverySummary => {
  const yesterdayDateKey = addDaysToDateKey(todayDateKey, -1);
  const summary: DeliverySummary = {
    bagged40Count: 0,
    bagged62Count: 0,
    bagged200Count: 0,
    loose40Count: 0,
    loose62Count: 0,
    totalIceBags: 0,
    bagLimes: 0,
    bagLemons: 0,
    bagOranges: 0,
    margaritaSalt: 0,
    freezePops: 0,
  };

  deliveries.forEach((delivery) => {
    const coolerSize = toLowerTrimmed(delivery.cooler_size);
    const iceType = toLowerTrimmed(delivery.ice_type);
    const coolerCount = toCount(delivery.cooler_num);
    const startDateKey = getDateKeyFromIso(delivery.start_date);
    const endDateKey = getDateKeyFromIso(delivery.end_date);

    const isPickupDay = endDateKey === yesterdayDateKey;

    if (!isPickupDay) {
      if (iceType === IceType.Loose && coolerSize === CoolerSize.Quart40) {
        summary.loose40Count += coolerCount;
      }

      if (iceType === IceType.Loose && coolerSize === CoolerSize.Quart62) {
        summary.loose62Count += coolerCount;
      }

      if (iceType === IceType.Bagged && coolerSize === CoolerSize.Quart40) {
        summary.bagged40Count += coolerCount;
        summary.totalIceBags += coolerCount * bagMultiplierByCoolerSize[CoolerSize.Quart40];
      }

      if (iceType === IceType.Bagged && coolerSize === CoolerSize.Quart62) {
        summary.bagged62Count += coolerCount;
        summary.totalIceBags += coolerCount * bagMultiplierByCoolerSize[CoolerSize.Quart62];
      }

      if (iceType === IceType.Bagged && coolerSize === CoolerSize.Quart200) {
        summary.bagged200Count += coolerCount;
        summary.totalIceBags += coolerCount * bagMultiplierByCoolerSize[CoolerSize.Quart200];
      }
    }

    if (startDateKey === todayDateKey) {
      summary.bagLimes += toCount(delivery.bag_limes);
      summary.bagLemons += toCount(delivery.bag_lemons);
      summary.bagOranges += toCount(delivery.bag_oranges);
      summary.margaritaSalt += toCount(delivery.marg_salt);
      summary.freezePops += toCount(delivery.freeze_pops);
    }
  });

  return summary;
};
