import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-dark inspired base palette
        "gh-bg": "#0d1117",
        "gh-panel": "#161b22",
        "gh-border": "#30363d",
        "gh-subtle": "#1f2937",
        "gh-fg": "#e6edf3",
        "gh-muted": "#8b949e",
        "gh-accent": "#2f81f7",
        "gh-green": "#3fb950",
        "gh-red": "#f85149",
        "gh-amber": "#d29922",
        "gh-purple": "#a371f7",
        "gh-pink": "#db61a2",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
