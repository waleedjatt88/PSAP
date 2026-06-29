/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1E3A8A",
          "blue-dark": "#172554",
          "blue-light": "#3B5BDB",
          orange: "#F59E0B",
          "orange-dark": "#D97706",
          "orange-light": "#FCD34D",
        },
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          300: "#CBD5E1",
          100: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(15, 23, 42, 0.06)",
        card: "0 2px 12px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
