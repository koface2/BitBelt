/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        belt: {
          white: "#FFFFFF",
          blue: "#1D4ED8",
          purple: "#7C3AED",
          brown: "#92400E",
          black: "#1F2937",
        },
        brand: {
          primary: "#F59E0B",
          dark: "#0f172a",
          darker: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
