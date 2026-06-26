import { ApiEndpoint } from "@/api/api-endpoint";
import { ApiResult, HttpMethod, httpRequest } from "@/api/http-client";
import {
  CreateDeliveryInput,
  DeliveriesResponse,
  Delivery,
  TipReportResponse,
} from "@/api/types";

export const createDelivery = async (
  payload: CreateDeliveryInput,
  token: string,
): Promise<ApiResult<Delivery>> => {
  return httpRequest<Delivery>(ApiEndpoint.DeliveryAdd, {
    method: HttpMethod.Post,
    body: payload,
    token,
  });
};

export const getTodayDeliveries = async (
  token: string,
): Promise<ApiResult<DeliveriesResponse>> => {
  return httpRequest<DeliveriesResponse>(ApiEndpoint.DeliveryGetToday, {
    token,
  });
};

export const getEndingTodayDeliveries = async (
  token: string,
): Promise<ApiResult<DeliveriesResponse>> => {
  return httpRequest<DeliveriesResponse>(ApiEndpoint.DeliveryGetEnding, {
    token,
  });
};

export const getAllDeliveries = async (
  token: string,
): Promise<ApiResult<DeliveriesResponse>> => {
  return httpRequest<DeliveriesResponse>(ApiEndpoint.DeliveryGetAll, {
    token,
  });
};

export const getDeliveriesByDateRange = async (
  startDate: string,
  endDate: string,
  token: string,
): Promise<ApiResult<DeliveriesResponse>> => {
  return httpRequest<DeliveriesResponse>(
    `${ApiEndpoint.DeliveryGetByDateRange}/${startDate}/${endDate}`,
    {
      token,
    },
  );
};

export const getDeliveryById = async (
  id: string,
  token: string,
): Promise<ApiResult<Delivery>> => {
  return httpRequest<Delivery>(`${ApiEndpoint.DeliveryGetById}/${id}`, {
    token,
  });
};

export const deleteDeliveryById = async (
  id: string,
  token: string,
): Promise<ApiResult<{ message?: string }>> => {
  return httpRequest<{ message?: string }>(
    `${ApiEndpoint.DeliveryDeleteById}/${id}`,
    {
      method: HttpMethod.Delete,
      token,
    },
  );
};

export const updateDeliveryById = async (
  id: string,
  payload: CreateDeliveryInput,
  token: string,
): Promise<ApiResult<Delivery>> => {
  return httpRequest<Delivery>(`${ApiEndpoint.DeliveryUpdateById}/${id}`, {
    method: HttpMethod.Put,
    body: payload,
    token,
  });
};

export const getTipReport = async (
  startDate: string,
  endDate: string,
  token: string,
): Promise<ApiResult<TipReportResponse>> => {
  return httpRequest<TipReportResponse>(
    `${ApiEndpoint.DeliveryTipReport}/${startDate}/${endDate}`,
    {
      token,
    },
  );
};
