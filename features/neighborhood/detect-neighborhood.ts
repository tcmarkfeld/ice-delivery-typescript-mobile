import {
  buckIsland,
  corollaLight,
  crownPoint,
  cruzBay,
  currituckClub,
  hijo,
  klmpq,
  monterayShores,
  neighborhoodData,
  oceanHill,
  pineIsland,
  sectionA,
  sectionB,
  sectionC,
  sectionD,
  sectionE,
  sectionF,
  spinDrift,
  whalehead,
  whaleheadRight,
} from '@/features/neighborhood/constants';

export type NeighborhoodOption = (typeof neighborhoodData)[number];

const normalizeAddress = (value: string): string => {
  return value.replace(/[^a-zA-Z]/g, '').toUpperCase();
};

export const detectNeighborhoodFromAddress = (
  address: string
): NeighborhoodOption | undefined => {
  const normalizedAddress = normalizeAddress(address);

  if (!normalizedAddress) {
    return undefined;
  }

  const neighborhoodByValue = new Map<number, NeighborhoodOption>(
    neighborhoodData.map((option) => [option.value, option])
  );

  if (sectionA.includes(normalizedAddress)) return neighborhoodByValue.get(7);
  if (sectionB.includes(normalizedAddress)) return neighborhoodByValue.get(8);
  if (sectionC.includes(normalizedAddress)) return neighborhoodByValue.get(9);
  if (sectionD.includes(normalizedAddress)) return neighborhoodByValue.get(10);
  if (sectionE.includes(normalizedAddress)) return neighborhoodByValue.get(11);
  if (sectionF.includes(normalizedAddress)) return neighborhoodByValue.get(12);
  if (hijo.includes(normalizedAddress)) return neighborhoodByValue.get(13);
  if (klmpq.includes(normalizedAddress)) return neighborhoodByValue.get(14);
  if (crownPoint.includes(normalizedAddress)) return neighborhoodByValue.get(15);
  if (spinDrift.includes(normalizedAddress)) return neighborhoodByValue.get(6);
  if (pineIsland.includes(normalizedAddress)) return neighborhoodByValue.get(5);
  if (buckIsland.includes(normalizedAddress)) return neighborhoodByValue.get(16);
  if (oceanHill.includes(normalizedAddress)) return neighborhoodByValue.get(1);
  if (corollaLight.includes(normalizedAddress)) return neighborhoodByValue.get(2);
  if (cruzBay.includes(normalizedAddress)) return neighborhoodByValue.get(19);
  if (whalehead.includes(normalizedAddress)) return neighborhoodByValue.get(3);
  if (whaleheadRight.includes(normalizedAddress)) return neighborhoodByValue.get(18);
  if (monterayShores.includes(normalizedAddress)) return neighborhoodByValue.get(17);
  if (currituckClub.includes(normalizedAddress)) return neighborhoodByValue.get(4);

  return undefined;
};
