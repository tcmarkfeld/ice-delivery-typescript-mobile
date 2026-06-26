import { useMutation } from "@tanstack/react-query";

import { loginUser } from "@/api/auth-api";
import { LoginResponse } from "@/api/types";
import { unwrapApiResult } from "@/api/unwrap-api-result";

export interface LoginInput {
  email: string;
  password: string;
}

export const useLoginMutation = () => {
  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: async ({ email, password }: LoginInput) => {
      const result = await loginUser(email, password);
      return unwrapApiResult(result);
    },
  });
};
