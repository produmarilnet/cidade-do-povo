import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Azul — cor da marca do Cidade do Povo
        marca: {
          50: "#EEF4FF",
          100: "#D9E5FF",
          200: "#B3CBFF",
          300: "#7FA6F5",
          400: "#4F7FE6",
          500: "#2F62D0",
          600: "#214DB0",
          700: "#1C3F8F",
          800: "#1A3573",
          900: "#152957",
        },
      },
    },
  },
  plugins: [],
};

export default config;
