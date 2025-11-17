import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/ui/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A237E',
          foreground: '#FFFFFF'
        },
        accent: {
          obc: '#047857',
          sni: '#0EA5E9',
          cf: '#F97316'
        },
        status: {
          info: '#3B82F6',
          warning: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
          neutral: '#9CA3AF'
        }
      },
      gridTemplateColumns: {
        'radio-3': 'repeat(3, minmax(min-content, 1fr))',
        'radio-4': 'repeat(4, minmax(min-content, 1fr))'
      }
    }
  },
  plugins: []
};

export default config;

