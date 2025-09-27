/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#e6fbfb",
          100: "#c8f3f2",
          200: "#98e6e4",
          300: "#66d8d6",
          400: "#3fc9c7",
          500: "#20bfb9",
          600: "#15a6a0",
          700: "#0f837f",
          800: "#0c6764",
          900: "#0a5250"
        }
      },
      boxShadow: {
        soft: "0 10px 25px rgba(32,191,185,0.15)"
      }
    }
  },
  plugins: []
}
