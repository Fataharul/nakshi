import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fbf9f4',
          dim: '#dbdad5',
          bright: '#fbf9f4',
          container: {
            lowest: '#ffffff',
            low: '#f5f3ee',
            DEFAULT: '#f0eee9',
            high: '#eae8e3',
            highest: '#e4e2dd',
          },
        },
        'on-surface': {
          DEFAULT: '#1b1c19',
          variant: '#53433d',
        },
        'inverse-surface': {
          DEFAULT: '#30312e',
          on: '#f2f1ec',
        },
        outline: {
          DEFAULT: '#86736c',
          variant: '#d9c2ba',
        },
        primary: {
          DEFAULT: '#86452a',
          on: '#ffffff',
          container: '#a45c40',
          'on-container': '#fff1ec',
          inverse: '#ffb59a',
          fixed: '#ffdbce',
          'fixed-dim': '#ffb59a',
          'on-fixed': '#380d00',
          'on-fixed-variant': '#72351c',
        },
        secondary: {
          DEFAULT: '#5f5e5e',
          on: '#ffffff',
          container: '#e2dfde',
          'on-container': '#636262',
          fixed: '#e5e2e1',
          'fixed-dim': '#c8c6c5',
          'on-fixed': '#1c1b1b',
          'on-fixed-variant': '#474746',
        },
        tertiary: {
          DEFAULT: '#5a574e',
          on: '#ffffff',
          container: '#736f65',
          'on-container': '#faf3e7',
          fixed: '#e8e2d6',
          'fixed-dim': '#cbc6ba',
          'on-fixed': '#1e1c14',
          'on-fixed-variant': '#4a473e',
        },
        error: {
          DEFAULT: '#ba1a1a',
          on: '#ffffff',
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        // Functional tokens from DESIGN_DIRECTION.md
        status: {
          live: '#B93826',
          valid: '#4E7A58',
          match: '#A45C40',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        ambient: '0 0 30px 0 rgba(27, 28, 25, 0.12)',
        'ambient-lg': '0 0 40px 0 rgba(27, 28, 25, 0.15)',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
