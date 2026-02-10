import { useQuery } from "@tanstack/react-query";

import {
  getAllDeliveries,
  getDeliveriesByDateRange,
  getTipReport,
  getTodayDeliveries,
} from "@/api/delivery-api";
import { ApiQueryKey } from "@/api/query-keys";
import { DeliveriesResponse, TipReportResponse } from "@/api/types";
import { unwrapApiResult } from "@/api/unwrap-api-result";

export const useTodayDeliveriesQuery = (token: string | null) => {
  return useQuery<DeliveriesResponse, Error>({
    queryKey: [ApiQueryKey.DeliveriesToday, token],
    queryFn: async () => {
      if (!token) {
        throw new Error("Missing auth token");
      }

      const result = await getTodayDeliveries(token);
      return unwrapApiResult(result);
    },
    enabled: !!token,
  });
};

export const useAllDeliveriesQuery = (token: string | null) => {
  return useQuery<DeliveriesResponse, Error>({
    queryKey: [ApiQueryKey.DeliveriesAll, token],
    queryFn: async () => {
      if (!token) {
        throw new Error("Missing auth token");
      }

      const result = await getAllDeliveries(token);
      return unwrapApiResult(result);
    },
    enabled: !!token,
  });
};

export const useDeliveriesByDateRangeQuery = (
  token: string | null,
  startDate: string,
  endDate: string,
  enabled = true,
) => {
  return useQuery<DeliveriesResponse, Error>({
    queryKey: [ApiQueryKey.DeliveriesByDateRange, token, startDate, endDate],
    queryFn: async () => {
      if (!token) {
        throw new Error("Missing auth token");
      }

      const result = await getDeliveriesByDateRange(startDate, endDate, token);
      return unwrapApiResult(result);
    },
    enabled: enabled && !!token,
  });
};

export const useTipReportQuery = (
  token: string | null,
  startDate: string,
  endDate: string,
  enabled = true,
  runId = 0,
) => {
  return useQuery<TipReportResponse, Error>({
    queryKey: [ApiQueryKey.DeliveryTipReport, token, startDate, endDate, runId],
    queryFn: async () => {
      if (!token) {
        throw new Error("Missing auth token");
      }

      const result = await getTipReport(startDate, endDate, token);
      return unwrapApiResult(result);
    },
    enabled: enabled && !!token,
  });
};
