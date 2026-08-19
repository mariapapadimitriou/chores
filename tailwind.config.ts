import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
      },
      colors: {
        cream: "#FBF6EE",
        ink: "#1F1B16",
        moss: "#4E7C4A",
        clay: "#C97B4A",
        rose: "#D96E7F",
        sky: "#5B8CBE",
        sun: "#E5B34B",
      },
    },
  },
  plugins: [],
};

export default config;
