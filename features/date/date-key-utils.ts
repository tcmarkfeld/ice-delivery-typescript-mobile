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

export interface DateKeyRange {
  startKey: string;
  endKey: string;
}

/** Monday–Sunday week containing `dateKey`, shifted by `weekOffset` weeks. */
export const getWeekRange = (dateKey: string, weekOffset = 0): DateKeyRange => {
  const dayOfWeek = parseIsoDateKey(dateKey).getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startKey = addDaysToDateKey(dateKey, -daysFromMonday + weekOffset * 7);

  return { startKey, endKey: addDaysToDateKey(startKey, 6) };
};

export const getMonthRange = (dateKey: string): DateKeyRange => {
  const date = parseIsoDateKey(dateKey);

  return {
    startKey: toIsoDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    endKey: toIsoDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
};
