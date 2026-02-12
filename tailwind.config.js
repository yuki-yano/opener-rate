/** @type {import("tailwindcss").Config} */
const withAlpha = (variable) => `rgb(var(--theme-${variable}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
      },
      colors: {
        ui: {
          bg: withAlpha("bg"),
          layer1: withAlpha("layer1"),
          layer2: withAlpha("layer2"),
          text: withAlpha("text"),
          text2: withAlpha("text2"),
          text3: withAlpha("text3"),
          border1: withAlpha("border1"),
          border2: withAlpha("border2"),
          border3: withAlpha("border3"),
          tone1: withAlpha("tone1"),
          tone2: withAlpha("tone2"),
          tone3: withAlpha("tone3"),
          primary: withAlpha("primary"),
          primary2: withAlpha("primary2"),
          red: withAlpha("red"),
          green: withAlpha("green"),
          yellow: withAlpha("yellow"),
        },
      },
      boxShadow: {
        panel:
          "0 1px 3px rgb(var(--theme-shadow) / 0.1), 0 1px 2px rgb(var(--theme-shadow) / 0.06)",
      },
    },
  },
  plugins: [],
};
