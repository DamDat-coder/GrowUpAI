/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      gap: {
        8: "2rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
      },
      fontFamily: {
        body: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  corePlugins: {
    preflight: false, // nếu bạn muốn dùng CSS reset của mình
  },
};
