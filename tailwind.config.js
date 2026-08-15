/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bảng màu cho từng nhóm dinh dưỡng, dùng nhất quán toàn app
        macro: {
          dam: '#3b82f6',
          tinhbot: '#f59e0b',
          beo: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
