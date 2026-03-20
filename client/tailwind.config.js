/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kavach: {
          orange: '#F97316',
          amber:  '#F59E0B',
          red:    '#EF4444',
          blue:   '#0EA5E9',
          green:  '#22C55E',
          dark:   '#1C1917',
          warm:   '#FFF7ED',
          card:   '#FFFBF5',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'heat-wave': 'heatWave 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        heatWave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.05)' },
        },
      },
      boxShadow: {
        'kavach': '0 4px 24px rgba(249,115,22,0.15)',
        'kavach-lg': '0 8px 40px rgba(249,115,22,0.2)',
        'card': '0 2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
