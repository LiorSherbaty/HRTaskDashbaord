/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'status-new': '#6B7280',
        'status-active': '#3B82F6',
        'status-blocked': '#EF4444',
        'status-completed': '#10B981',
        'warning': '#F59E0B',
        'danger': '#EF4444',
      },
    },
  },
  plugins: [],
}
