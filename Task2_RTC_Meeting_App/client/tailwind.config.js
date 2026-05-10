export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#080b12',
        'bg-surface': '#0e1219',
        'bg-panel': 'rgba(14, 18, 25, 0.85)',
        'accent': '#6366f1',
        'accent-bright': '#818cf8',
        'accent-hover': '#4f46e5',
        'accent-glow': 'rgba(99, 102, 241, 0.35)',
        'teal': '#14b8a6',
        'border-bright': 'rgba(255, 255, 255, 0.14)',
      },
      backgroundImage: {
        'ai-glow': 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'ai': '0 0 40px rgba(99, 102, 241, 0.2)',
        'ai-hover': '0 0 60px rgba(99, 102, 241, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
