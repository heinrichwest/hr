export const speccon = {
  color: {
    brand: {
      primary: "#12265E",  // Blue
      accent: "#FFA600",   // Orange (PDF shows ##FFA600)
      support: "#92ABC4",  // Light Blue
      white: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: {
      sans: '"Roboto", system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
      serif: '"Times New Roman", Times, serif',
    },
    // keep simple; teams can adjust sizes per product needs
    scale: {
      body: "16px",
      small: "14px",
      caption: "12px",
      h1: "40px",
      h2: "32px",
      h3: "24px",
    },
    lineHeight: {
      body: 1.5,
      heading: 1.2,
    },
  },
} as const;

export type SpecconTokens = typeof speccon;
