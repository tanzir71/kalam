import { colors, radius, shadows, spacing, typography } from "./tokens";

const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        k: colors
      },
      spacing: {
        k: spacing
      },
      borderRadius: {
        k: radius
      },
      boxShadow: {
        k: shadows
      },
      fontSize: {
        k: typography
      }
    }
  }
};

export default tailwindPreset;
