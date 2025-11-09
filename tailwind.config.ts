import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Minecraft-inspired color palette
        primary: {
          50: '#C6FFC6',  // Light green
          100: '#92FF92', // Bright green
          200: '#5EFF5E', // Lime green
          300: '#2AFF2A', // Neon green
          400: '#00F600', // Pure green
          500: '#00C200', // Medium green
          600: '#008E00', // Dark green
          700: '#005A00', // Forest green
          800: '#002600', // Deep green
          900: '#001300', // Almost black green
        },
        game: {
          background: '#1A1C2C', // Dark background
          surface: '#2A2C3C',    // Slightly lighter surface
          accent1: '#7A3BB3',    // Purple accent
          accent2: '#41A6F6',    // Blue accent
          accent3: '#FF6B6B',    // Red accent
          text: '#E0E0E0',       // Light text
          textDim: '#9A9AB0',    // Dimmed text
          border: '#3A3C4C',     // Border color
          highlight: '#FFB938',  // Gold highlight
        },
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #10b981, 0 0 10px #10b981, 0 0 15px #10b981' },
          '100%': { boxShadow: '0 0 10px #10b981, 0 0 20px #10b981, 0 0 30px #10b981' },
        },
      },
    },
  },
  plugins: [],
}
export default config

