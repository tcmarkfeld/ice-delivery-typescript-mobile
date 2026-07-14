import { Delivery } from "@/api/types";
import { addDaysToDateKey } from "@/features/date/date-key-utils";

export enum IceType {
  Bagged = "bagged ice",
  Loose = "loose ice",
}

export enum CoolerSize {
  Quart40 = "40 quart",
  Quart62 = "62 quart",
  Quart200 = "big ass 200 qt",
}

export enum BusinessTimeZone {
  Eastern = "America/New_York",
}

export interface DeliverySummary {
  deliveryCount: number;
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
  if (typeof value === "number") {
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

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BusinessTimeZone.Eastern,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
};

const getAddressHouseNumber = (address: string): number => {
  const parsedValue = Number.parseFloat(address);

  if (Number.isNaN(parsedValue)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsedValue;
};

const getNeighborhoodNumber = (neighborhood: string): number => {
  const parsedValue = Number.parseInt(neighborhood, 10);
  return Number.isNaN(parsedValue) ? Number.MAX_SAFE_INTEGER : parsedValue;
};

enum DeliveryNeighborhood {
  OceanHill = 1,
  Whalehead = 3,
  PineIsland = 5,
}

enum WhaleheadAddressPrefix {
  C = "C",
  W = "W",
  L = "L",
}

const neighborhoodSortOrder = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
];

const neighborhoodSortPriority = new Map<number, number>(
  neighborhoodSortOrder.map((neighborhood, index) => [neighborhood, index]),
);

const whaleheadAddressPrefixPriority: Record<WhaleheadAddressPrefix, number> = {
  [WhaleheadAddressPrefix.C]: 0,
  [WhaleheadAddressPrefix.W]: 1,
  [WhaleheadAddressPrefix.L]: 2,
};

const getNeighborhoodSortPriority = (neighborhood: string): number => {
  return (
    neighborhoodSortPriority.get(getNeighborhoodNumber(neighborhood)) ??
    Number.MAX_SAFE_INTEGER
  );
};

const getWhaleheadAddressPrefix = (
  address: string,
): WhaleheadAddressPrefix | null => {
  const prefix = address
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 1);

  if (prefix === WhaleheadAddressPrefix.C) {
    return WhaleheadAddressPrefix.C;
  }

  if (prefix === WhaleheadAddressPrefix.W) {
    return WhaleheadAddressPrefix.W;
  }

  if (prefix === WhaleheadAddressPrefix.L) {
    return WhaleheadAddressPrefix.L;
  }

  return null;
};

const getWhaleheadAddressPrefixPriority = (address: string): number => {
  const prefix = getWhaleheadAddressPrefix(address);
  return prefix
    ? whaleheadAddressPrefixPriority[prefix]
    : Number.MAX_SAFE_INTEGER;
};

const compareWhaleheadAddresses = (
  leftAddress: string,
  rightAddress: string,
): number => {
  const leftAddressValue = getAddressHouseNumber(leftAddress);
  const rightAddressValue = getAddressHouseNumber(rightAddress);
  const hasHighAddress = leftAddressValue > 925 || rightAddressValue > 925;

  if (leftAddressValue !== rightAddressValue) {
    if (hasHighAddress) {
      if (leftAddressValue >= 925 && rightAddressValue >= 925) {
        return (
          getWhaleheadAddressPrefixPriority(leftAddress) -
          getWhaleheadAddressPrefixPriority(rightAddress)
        );
      }

      if (leftAddressValue >= 925) {
        return -1;
      }

      if (rightAddressValue >= 925) {
        return 1;
      }
    }

    return rightAddressValue - leftAddressValue;
  }

  return (
    getWhaleheadAddressPrefixPriority(leftAddress) -
    getWhaleheadAddressPrefixPriority(rightAddress)
  );
};

const compareDeliveryAddresses = (left: Delivery, right: Delivery): number => {
  const neighborhood = getNeighborhoodNumber(left.neighborhood);

  if (
    neighborhood === DeliveryNeighborhood.OceanHill ||
    neighborhood === DeliveryNeighborhood.PineIsland
  ) {
    return (
      getAddressHouseNumber(left.delivery_address) -
      getAddressHouseNumber(right.delivery_address)
    );
  }

  if (neighborhood === DeliveryNeighborhood.Whalehead) {
    return compareWhaleheadAddresses(
      left.delivery_address,
      right.delivery_address,
    );
  }

  return (
    getAddressHouseNumber(right.delivery_address) -
    getAddressHouseNumber(left.delivery_address)
  );
};

export const sortDeliveries = (deliveries: Delivery[]): Delivery[] => {
  return [...deliveries].sort((left, right) => {
    const neighborhoodDifference =
      getNeighborhoodSortPriority(left.neighborhood) -
      getNeighborhoodSortPriority(right.neighborhood);

    if (neighborhoodDifference !== 0) {
      return neighborhoodDifference;
    }

    const addressDifference = compareDeliveryAddresses(left, right);

    if (addressDifference !== 0) {
      return addressDifference;
    }

    return left.delivery_address.localeCompare(right.delivery_address);
  });
};

export const buildDeliverySummary = (
  deliveries: Delivery[],
  todayDateKey: string,
): DeliverySummary => {
  const yesterdayDateKey = addDaysToDateKey(todayDateKey, -1);
  const summary: DeliverySummary = {
    deliveryCount: 0,
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
    summary.deliveryCount += 1;

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
        summary.totalIceBags +=
          coolerCount * bagMultiplierByCoolerSize[CoolerSize.Quart40];
      }

      if (iceType === IceType.Bagged && coolerSize === CoolerSize.Quart62) {
        summary.bagged62Count += coolerCount;
        summary.totalIceBags +=
          coolerCount * bagMultiplierByCoolerSize[CoolerSize.Quart62];
      }

      if (iceType === IceType.Bagged && coolerSize === CoolerSize.Quart200) {
        summary.bagged200Count += coolerCount;
        summary.totalIceBags +=
          coolerCount * bagMultiplierByCoolerSize[CoolerSize.Quart200];
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
