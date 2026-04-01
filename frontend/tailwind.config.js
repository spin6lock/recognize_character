/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF8C00',
        secondary: '#FFD700',
      },
      fontFamily: {
        round: ['"ZCOOL XiaoWei"', '"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
