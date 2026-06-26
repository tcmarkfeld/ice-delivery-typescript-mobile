const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const toIsoDateKey = (dateValue: Date): string => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const parseIsoDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const sanitizeDateKey = (value: string): string => value.slice(0, 10);

export const isValidDateKey = (value: string): boolean => {
  if (!dateKeyPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const dateValue = new Date(year, month - 1, day);

  return (
    dateValue.getFullYear() === year &&
    dateValue.getMonth() === month - 1 &&
    dateValue.getDate() === day
  );
};

export const formatDateRangeLabel = (
  startDateKey: string,
  endDateKey: string,
): string => {
  const startDate = parseIsoDateKey(startDateKey);
  const endDate = parseIsoDateKey(endDateKey);
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

export const addDaysToDateKey = (dateKey: string, days: number): string => {
  const dateValue = parseIsoDateKey(dateKey);
  dateValue.setDate(dateValue.getDate() + days);
  return toIsoDateKey(dateValue);
};
