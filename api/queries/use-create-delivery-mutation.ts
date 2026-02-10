import { useMutation } from '@tanstack/react-query';

import { createDelivery } from '@/api/delivery-api';
import { CreateDeliveryInput, Delivery } from '@/api/types';
import { unwrapApiResult } from '@/api/unwrap-api-result';

export interface CreateDeliveryMutationInput {
  payload: CreateDeliveryInput;
  token: string;
}

export const useCreateDeliveryMutation = () => {
  return useMutation<Delivery, Error, CreateDeliveryMutationInput>({
    mutationFn: async ({ payload, token }) => {
      const result = await createDelivery(payload, token);
      return unwrapApiResult(result);
    },
  });
};
