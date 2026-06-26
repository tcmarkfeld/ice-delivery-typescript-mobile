import { AppThemes } from "@/constants/theme";
import { useThemeMode } from "@/providers/app-theme-provider";

export const useAppTheme = () => {
  const { themeMode } = useThemeMode();

  return AppThemes[themeMode];
};
