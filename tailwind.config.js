/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/@fluffylabs/shared-ui/dist/*.{js,ts,jsx,tsx}",
    "node_modules/@fluffylabs/shared-ui/lib/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
