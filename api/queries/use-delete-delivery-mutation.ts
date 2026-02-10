import { useMutation } from '@tanstack/react-query';

import { deleteDeliveryById } from '@/api/delivery-api';
import { unwrapApiResult } from '@/api/unwrap-api-result';

export interface DeleteDeliveryMutationInput {
  id: string;
  token: string;
}

export const useDeleteDeliveryMutation = () => {
  return useMutation<{ message?: string }, Error, DeleteDeliveryMutationInput>({
    mutationFn: async ({ id, token }) => {
      const result = await deleteDeliveryById(id, token);
      return unwrapApiResult(result);
    },
  });
};
