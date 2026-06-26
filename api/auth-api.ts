import { ApiEndpoint } from "@/api/api-endpoint";
import { ApiResult, HttpMethod, httpRequest } from "@/api/http-client";
import { LoginResponse } from "@/api/types";

export const loginUser = async (
  email: string,
  password: string,
): Promise<ApiResult<LoginResponse>> => {
  return httpRequest<LoginResponse>(ApiEndpoint.LoginUser, {
    method: HttpMethod.Post,
    body: {
      email,
      password,
    },
  });
};
