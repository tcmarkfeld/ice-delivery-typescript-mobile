import { useColorScheme as useNativeColorScheme } from 'react-native';

import { AppColorScheme } from '@/constants/theme';

export const useColorScheme = (): AppColorScheme => {
  return useNativeColorScheme() ?? 'light';
};
