/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          void: '#0a0a1a',
          deep: '#121228',
          nebula: '#1a1a3a',
          gold: '#c9a227',
          'gold-bright': '#ffd700',
          'gold-dark': '#8b7500',
          energy: {
            red: '#ff4444',
            orange: '#ff8844',
            blue: '#4488ff',
            cyan: '#00ffff',
            purple: '#8844ff',
            green: '#44ff88',
          },
          zone1: {
            dark: '#4a0000',
            mid: '#8b0000',
            bright: '#ff4444',
            glow: '#ff6666',
          },
          zone2: {
            dark: '#003366',
            mid: '#0066cc',
            bright: '#4488ff',
            glow: '#66aaff',
          },
        },
        gauge: {
          frame: '#8b7500',
          'frame-light': '#c9a227',
          'frame-dark': '#5a4a00',
          glass: 'rgba(255, 255, 255, 0.05)',
          needle: '#ffd700',
        },
      },
      fontFamily: {
        cosmic: ['Orbitron', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cosmic-glow': '0 0 20px rgba(201, 162, 39, 0.5)',
        'energy-red': '0 0 30px rgba(255, 68, 68, 0.6)',
        'energy-blue': '0 0 30px rgba(68, 136, 255, 0.6)',
        'inner-glow': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'wave': 'wave 4s ease-in-out infinite',
        'needle-swing': 'needleSwing 2s ease-in-out infinite',
        'energy-flow': 'energyFlow 3s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        needleSwing: {
          '0%, 100%': { transform: 'rotate(-30deg)' },
          '50%': { transform: 'rotate(30deg)' },
        },
        energyFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'cosmic-gradient': 'radial-gradient(ellipse at center, #1a1a3a 0%, #0a0a1a 100%)',
        'gold-gradient': 'linear-gradient(135deg, #8b7500 0%, #c9a227 50%, #ffd700 100%)',
        'energy-red': 'linear-gradient(90deg, #4a0000, #ff4444, #4a0000)',
        'energy-blue': 'linear-gradient(90deg, #003366, #4488ff, #003366)',
      },
    },
  },
  plugins: [],
};
