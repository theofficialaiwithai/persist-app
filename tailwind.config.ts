import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        "muted-foreground": "var(--muted-foreground)",
        persist: {
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          indigo: '#4F46E5',
          emerald: '#10B981',
          text: '#111827',
          muted: '#6B7280',
          error: '#EF4444',
          border: '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
};
export default config;
