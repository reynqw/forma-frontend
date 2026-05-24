/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f3f0ff',
          100: '#e9e2ff',
          200: '#d4c6ff',
          300: '#b49eff',
          400: '#9B7EF2',
          500: '#6B4CE6',  // основной цвет FORMA из Figma
          600: '#5a3dd0',
          700: '#4a30b5',
          800: '#3d2896',
          900: '#33227a',
          950: '#1e1250',
        },
        surface: {
          50:  '#FFFFFF',
          100: '#F8F8F8',  // основной фон страницы из Figma
          200: '#F0F0F0',
          300: '#E5E5E5',  // бордеры инпутов из Figma
          400: '#D1D1D1',
        },
        text: {
          primary:   '#1A1A1A',  // заголовки из Figma
          secondary: '#6B6B6B',  // вторичный текст из Figma
          muted:     '#9B9B9B',
        },
        dark: {
          900: '#1A1A1A',  // Footer из Figma
          800: '#2A2A2A',
          700: '#3A3A3A',
        },
      },
      fontFamily: {
        sans:     ['Inter', 'system-ui', 'sans-serif'],
        logo:     ['Pacifico', 'cursive'],
        display:  ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'xl':  '12px',  // инпуты из Figma
        '2xl': '16px',  // карточки из Figma
        '3xl': '24px',
      },
      boxShadow: {
        'card':    '0px 2px 8px rgba(0, 0, 0, 0.06)',
        'card-lg': '0px 4px 16px rgba(0, 0, 0, 0.08)',
        'card-xl': '0px 8px 30px rgba(0, 0, 0, 0.12)',
        'header':  '0px 2px 8px rgba(0, 0, 0, 0.06)',
        'glow':    '0px 0px 40px rgba(107, 76, 230, 0.15)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out',
        'fade-in-up':   'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in-down': 'fadeInDown 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-up':     'slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-down':   'slideDown 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'hero-text':    'heroText 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'hero-badge':   'heroBadge 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'stagger-1':    'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s both',
        'stagger-2':    'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both',
        'stagger-3':    'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s both',
        'stagger-4':    'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        heroText: {
          '0%':   { opacity: '0', transform: 'translateY(30px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        heroBadge: {
          '0%':   { opacity: '0', transform: 'translateY(-10px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
