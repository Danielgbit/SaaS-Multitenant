import type { ThemeColors } from "@/hooks/useThemeColors";

export function pageBg(colors: ThemeColors): React.CSSProperties {
  return { background: colors.primaryGradient };
}

export function subtleBg(colors: ThemeColors): React.CSSProperties {
  return { backgroundColor: colors.surfaceSubtle };
}
