/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        niwa: {
          bg: '#0a0a0f',
          surface: '#141420',
          card: '#1a1a2e',
          border: '#2a2a3e',
          primary: '#6366f1',
          'primary-glow': '#818cf8',
          accent: '#f59e0b',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
          'text-muted': '#64748b',
          npc: '#334155',
          player: '#312e81',
          danger: '#ef4444',
          success: '#22c55e',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
