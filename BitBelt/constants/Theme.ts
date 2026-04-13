// Re-export the shared BitBelt design-system tokens so the Expo app
// can access them via the "@/constants/Theme" path alias.
export {
  Theme,
  ThemeColors,
  Spacing,
  Typography,
  Radius,
  Shadow,
  TouchTarget,
} from "../../constants/Theme";
export type { ThemeType } from "../../constants/Theme";
