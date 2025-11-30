module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.js"],
  theme: { extend: {} },
  plugins: [
    require("@tailwindcss/typography"), 
    require('daisyui')
  ],
  daisyui: { themes: ["dim", "dark", "cupcake"] },
}