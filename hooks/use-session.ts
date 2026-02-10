import { useContext } from 'react';

import { SessionContext, SessionContextValue } from '@/auth/session-provider';

export const useSession = (): SessionContextValue => {
  return useContext(SessionContext);
};
