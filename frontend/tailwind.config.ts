import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#edf8ff", 500: "#087ea4", 600: "#066a8c", 900: "#073b4c" },
      },
    },
  },
  plugins: [],
};

export default config;
