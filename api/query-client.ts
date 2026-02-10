import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
};
