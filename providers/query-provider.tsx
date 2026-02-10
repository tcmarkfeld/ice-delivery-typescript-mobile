import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';

import { createQueryClient } from '@/api/query-client';

export const QueryProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
