/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  mode: 'jit',  // Enable JIT mode

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    './node_modules/preline/preline.js',

  ],
  theme: {
    extend: {},
  },
  plugins: [
      require('daisyui'),
      require('flowbite/plugin')({
        charts: true,
    }),
  ],
}