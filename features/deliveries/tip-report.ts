import { toAmount } from "@/features/deliveries/delivery-utils";

interface TipRow {
  tip?: string | number;
}

interface TipReportObject {
  totalTips?: unknown;
  totalTip?: unknown;
  total?: unknown;
  tipTotal?: unknown;
  results?: unknown;
  data?: unknown;
  rows?: unknown;
}

const extractTipRows = (value: unknown): TipRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is TipRow => {
    return typeof item === "object" && item !== null && "tip" in item;
  });
};

const sumTipRows = (rows: TipRow[]): number => {
  return rows.reduce((sum, row) => sum + toAmount(row.tip ?? 0), 0);
};

/** The tip endpoint has returned several shapes over time; accept all of them. */
export const getTipReportTotal = (responseData: unknown): number => {
  if (typeof responseData === "string") {
    return toAmount(responseData);
  }

  if (typeof responseData === "number") {
    return responseData;
  }

  if (Array.isArray(responseData)) {
    return sumTipRows(extractTipRows(responseData));
  }

  if (typeof responseData === "object" && responseData !== null) {
    const typedResponse = responseData as TipReportObject;
    const tipRows = [
      typedResponse.results,
      typedResponse.data,
      typedResponse.rows,
    ]
      .map(extractTipRows)
      .find((rows) => rows.length > 0);

    if (tipRows) {
      return sumTipRows(tipRows);
    }

    return toAmount(
      String(
        typedResponse.totalTips ??
          typedResponse.totalTip ??
          typedResponse.total ??
          typedResponse.tipTotal ??
          0,
      ),
    );
  }

  return 0;
};
