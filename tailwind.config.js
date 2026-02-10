/** @type {import("tailwindcss").Config} */
const withAlpha = (variable) => `rgb(var(--ctp-${variable}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        latte: {
          base: withAlpha("base"),
          mantle: withAlpha("mantle"),
          crust: withAlpha("crust"),
          text: withAlpha("text"),
          subtext1: withAlpha("subtext1"),
          subtext0: withAlpha("subtext0"),
          surface0: withAlpha("surface0"),
          surface1: withAlpha("surface1"),
          surface2: withAlpha("surface2"),
          overlay0: withAlpha("overlay0"),
          overlay1: withAlpha("overlay1"),
          overlay2: withAlpha("overlay2"),
          blue: withAlpha("blue"),
          lavender: withAlpha("lavender"),
          peach: withAlpha("peach"),
          red: withAlpha("red"),
          green: withAlpha("green"),
          yellow: withAlpha("yellow"),
          mauve: withAlpha("mauve"),
          maroon: withAlpha("maroon"),
        },
      },
    },
  },
  plugins: [],
};
