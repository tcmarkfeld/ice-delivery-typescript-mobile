import { useMutation } from "@tanstack/react-query";

import { updateDeliveryById } from "@/api/delivery-api";
import { CreateDeliveryInput, Delivery } from "@/api/types";
import { unwrapApiResult } from "@/api/unwrap-api-result";

export interface UpdateDeliveryMutationInput {
  id: string;
  payload: CreateDeliveryInput;
  token: string;
}

export const useUpdateDeliveryMutation = () => {
  return useMutation<Delivery, Error, UpdateDeliveryMutationInput>({
    mutationFn: async ({ id, payload, token }) => {
      const result = await updateDeliveryById(id, payload, token);
      return unwrapApiResult(result);
    },
  });
};
