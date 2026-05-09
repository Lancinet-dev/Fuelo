export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0F172A',
        surface: '#1E293B',
        amber: { DEFAULT: '#F59E0B', dark: '#D97706' },
        success: '#10B981',
        danger: '#EF4444',
      }
    }
  },
  plugins: []
}