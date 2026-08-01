import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["'Archivo Black'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        accent: ["Syne", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        gv: {
          bg0h: "var(--gv-bg0h)",
          bg0: "var(--gv-bg0)",
          bg1: "var(--gv-bg1)",
          bg2: "var(--gv-bg2)",
          bg3: "var(--gv-bg3)",
          bg4: "var(--gv-bg4)",
          fg0: "var(--gv-fg0)",
          fg1: "var(--gv-fg1)",
          fg2: "var(--gv-fg2)",
          fg3: "var(--gv-fg3)",
          fg4: "var(--gv-fg4)",
          gray: "var(--gv-gray)",
          red: "var(--gv-red)",
          green: "var(--gv-green)",
          yellow: "var(--gv-yellow)",
          blue: "var(--gv-blue)",
          purple: "var(--gv-purple)",
          aqua: "var(--gv-aqua)",
          orange: "var(--gv-orange)",
        },
      },
      boxShadow: {
        brutal: "6px 6px 0px 0px var(--gv-fg1)",
        "brutal-sm": "3px 3px 0px 0px var(--gv-fg1)",
        "brutal-lg": "10px 10px 0px 0px var(--gv-fg1)",
        "brutal-yellow": "6px 6px 0px 0px var(--gv-yellow)",
        "brutal-hover": "2px 2px 0px 0px var(--gv-fg1)",
      },
      borderWidth: { 3: "3px", 5: "5px" },
    },
  },
  plugins: [],
} satisfies Config;
