import { ApiResult } from "@/api/http-client";

export const unwrapApiResult = <TData>(result: ApiResult<TData>): TData => {
  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.data;
};
