/* PhysioCare — TailwindCSS theme mapped to the Kinetic Atlas tokens. Expected result: semantic Tailwind classes resolve to the shared token source. */

/** @type {import('tailwindcss').Config} */
const colorSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Build a Tailwind color scale from CSS design-token variables.
 *
 * @param {string} name - The token family name.
 * @returns {Record<number, string>} The Tailwind color scale.
 */
const colorScale = (name) =>
  Object.fromEntries(
    colorSteps.map((step) => [step, `var(--pc-${name}-${step})`])
  );

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neutral: colorScale('neutral'),
        primary: colorScale('primary'),
        success: colorScale('success'),
        warning: colorScale('warning'),
        danger: colorScale('danger'),
        info: colorScale('info'),
        ink: {
          DEFAULT: 'var(--pc-color-text-primary)',
          muted: 'var(--pc-color-text-secondary)',
        },
        surface: {
          page: 'var(--pc-color-surface-page)',
          DEFAULT: 'var(--pc-color-surface)',
        },
        line: 'var(--pc-color-border)',
      },
      fontFamily: {
        sans: ['Aptos', 'PingFang TC', 'Microsoft JhengHei', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'pc-11': 'var(--pc-font-size-11)',
        'pc-12': 'var(--pc-font-size-12)',
        'pc-13': 'var(--pc-font-size-13)',
        'pc-14': 'var(--pc-font-size-14)',
        'pc-16': 'var(--pc-font-size-16)',
        'pc-18': 'var(--pc-font-size-18)',
        'pc-20': 'var(--pc-font-size-20)',
        'pc-24': 'var(--pc-font-size-24)',
        'pc-30': 'var(--pc-font-size-30)',
        'pc-36': 'var(--pc-font-size-36)',
        'pc-48': 'var(--pc-font-size-48)',
      },
      spacing: {
        page: 'var(--pc-space-page)',
        section: 'var(--pc-space-8)',
        card: 'var(--pc-space-6)',
      },
      borderRadius: {
        xs: 'var(--pc-radius-xs)',
        sm: 'var(--pc-radius-sm)',
        md: 'var(--pc-radius-md)',
        lg: 'var(--pc-radius-lg)',
        xl: 'var(--pc-radius-xl)',
      },
      boxShadow: {
        panel: 'var(--pc-shadow-panel)',
      },
      transitionDuration: {
        quick: 'var(--pc-motion-quick)',
        standard: 'var(--pc-motion-standard)',
        emphasis: 'var(--pc-motion-emphasis)',
      },
      transitionTimingFunction: {
        brand: 'var(--pc-ease-standard)',
      },
      zIndex: {
        base: 'var(--pc-z-base)',
        sticky: 'var(--pc-z-sticky)',
        overlay: 'var(--pc-z-overlay)',
        modal: 'var(--pc-z-modal)',
        toast: 'var(--pc-z-toast)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
