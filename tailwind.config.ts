import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
      },
      colors: {
        base: "#0B111C",   // page — deep cool navy
        panel: "#151D2B",  // card surface
        fg: "#E9EFFA",     // foreground — cool near-white
        accent: "#4FC3E8",  // primary action / selection
        moss: "#3BC98F",   // done / on-track
        clay: "#E0A93A",   // due soon
        rose: "#FF6B7D",   // overdue / destructive
        sky: "#3AA0DE",
        sun: "#E0B84A",
        plum: "#A78BFA",
        teal: "#35B8C9",
      },
    },
  },
  plugins: [],
};

export default config;
