export const colors = {
  primary: "#3B3B98",
  primaryHover: "#32328A",
  primarySubtle: "#EBEBFB",
  accent: "#16B8A6",
  bg: "#FBFAF7",
  surface: "#FFFFFF",
  surface2: "#F3F2EE",
  border: "#E4E2DC",
  text: "#1C1B22",
  textMuted: "#63616C",
  textSubtle: "#74717D",
  spelling: "#E5484D",
  grammar: "#F5A623",
  style: "#3B82F6",
  readability: "#8B5CF6",
  success: "#12A150",
  local: "#12A150",
  cloud: "#F5A623",
  tierNoai: "#63616C"
} as const;

export const darkColors = {
  bg: "#14131A",
  surface: "#1E1D26",
  surface2: "#25242D",
  border: "#2A2933",
  text: "#ECEBF0",
  textMuted: "#B8B5C2",
  textSubtle: "#898696",
  primarySubtle: "#252451"
} as const;

export const spacing = {
  "0_5": "2px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px"
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  pill: "999px"
} as const;

export const typography = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  md: "1.125rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "1.875rem",
  "3xl": "2.25rem"
} as const;

export const shadows = {
  e1: "0 8px 24px rgba(28, 27, 34, 0.10)",
  e2: "0 14px 36px rgba(28, 27, 34, 0.14)",
  e3: "0 24px 64px rgba(28, 27, 34, 0.18)"
} as const;

export const tokens = {
  colors,
  darkColors,
  spacing,
  radius,
  typography,
  shadows
} as const;
