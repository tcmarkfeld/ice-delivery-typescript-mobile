import { useCallback, useMemo, useState } from "react";

import { ApiResult } from "@/api/http-client";

export interface UseApiResult<TData> {
  data: TData | null;
  error: string | null;
  isLoading: boolean;
  request: (...args: unknown[]) => Promise<ApiResult<TData>>;
}

export const useApi = <TData>(
  requestFn: (...args: unknown[]) => Promise<ApiResult<TData>>,
): UseApiResult<TData> => {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const request = useCallback(
    async (...args: unknown[]): Promise<ApiResult<TData>> => {
      setIsLoading(true);

      const response = await requestFn(...args);

      setIsLoading(false);

      if (!response.ok) {
        setError(response.error);
        return response;
      }

      setError(null);
      setData(response.data);
      return response;
    },
    [requestFn],
  );

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      request,
    }),
    [data, error, isLoading, request],
  );
};
