import { useColorScheme as useNativeColorScheme } from 'react-native';

import { AppColorScheme } from '@/constants/theme';

export function useColorScheme(): AppColorScheme {
  return useNativeColorScheme() ?? 'light';
}
