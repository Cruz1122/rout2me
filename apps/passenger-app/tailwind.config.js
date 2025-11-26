/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/shared/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales ligados a variables CSS (light/dark)
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
        terciary: 'rgb(var(--color-terciary-rgb) / <alpha-value>)',
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        card: 'rgb(var(--color-card-rgb) / <alpha-value>)',
        text: 'rgb(var(--color-text-rgb) / <alpha-value>)',
        accent:
          'rgb(var(--color-accent-rgb, var(--color-primary-rgb)) / <alpha-value>)',

        // Estados
        error: 'rgb(var(--color-error-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        info: 'rgb(var(--color-info-rgb) / <alpha-value>)',

        // Grises semánticos
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
      },
    },
  },
};
