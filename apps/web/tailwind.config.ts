import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50:  '#F2F7EC',
          100: '#E3EDDA',
          200: '#C8DBB5',
          300: '#ACC990',
          400: '#90B76C',
          500: '#6B8F35',
          600: '#5C7A2C',
          700: '#4A6020',
          800: '#374814',
          900: '#232F0D',
        },
        accent: {
          50:  '#FDF4EE',
          100: '#FAE5D2',
          200: '#F5C9A3',
          300: '#F0AC74',
          400: '#EB8F45',
          500: '#E07336',
          600: '#D4622A',
          700: '#B04E1F',
          800: '#8C3C16',
          900: '#6E2D0E',
        },
        cream: {
          50:  '#FEFCF9',
          100: '#FDF8F2',
          200: '#FBF2E7',
          300: '#F8EBDB',
          400: '#F4E2CB',
          500: '#EDD5B6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
