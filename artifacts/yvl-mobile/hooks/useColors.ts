import { useTheme } from "@/contexts/ThemeContext";
import colors from "@/constants/colors";

export function useColors() {
  const { accent } = useTheme();
  return {
    ...colors.dark,
    accent,
    primary: accent,
    accentForeground: "#000000",
    primaryForeground: "#000000",
    radius: colors.radius,
  };
}
