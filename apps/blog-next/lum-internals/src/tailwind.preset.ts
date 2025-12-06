/**
 * Lum.tools Tailwind CSS Preset
 * 
 * Glass/Liquid/Isomorphic Design System
 * 
 * Usage:
 * ```ts
 * // tailwind.config.ts
 * import lumPreset from '@lum-tools/lum-internals/tailwind.preset';
 * 
 * export default {
 *   presets: [lumPreset],
 *   content: ['./src/**\/*.{ts,tsx}'],
 * };
 * ```
 */

import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const lumPreset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      // === Brand Colors ===
      colors: {
        // Brand palette
        luminous: {
          orange: {
            DEFAULT: '#FF8000',
            light: '#FF9933',
            dark: '#CC6600',
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#FF8000',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12',
          },
          pink: {
            DEFAULT: '#E94055',
            light: '#FF6B7A',
            dark: '#C43344',
            50: '#FFF1F2',
            100: '#FFE4E6',
            200: '#FECDD3',
            300: '#FDA4AF',
            400: '#FB7185',
            500: '#E94055',
            600: '#E11D48',
            700: '#BE123C',
            800: '#9F1239',
            900: '#881337',
          },
          violet: {
            DEFAULT: '#8A2BE2',
            light: '#A855F7',
            dark: '#6B21A8',
            50: '#FAF5FF',
            100: '#F3E8FF',
            200: '#E9D5FF',
            300: '#D8B4FE',
            400: '#C084FC',
            500: '#8A2BE2',
            600: '#9333EA',
            700: '#7C3AED',
            800: '#6B21A8',
            900: '#581C87',
          },
        },
        
        // Semantic colors using CSS variables
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        
        // Glass colors
        glass: {
          DEFAULT: 'var(--glass-bg)',
          subtle: 'var(--glass-bg-subtle)',
          strong: 'var(--glass-bg-strong)',
          border: 'var(--glass-border)',
        },
      },
      
      // === Border Radius ===
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      
      // === Typography ===
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      
      // === Spacing (8px grid) ===
      spacing: {
        '4.5': '1.125rem', // 18px
        '13': '3.25rem',   // 52px
        '15': '3.75rem',   // 60px
        '17': '4.25rem',   // 68px
        '18': '4.5rem',    // 72px
        '22': '5.5rem',    // 88px
      },
      
      // === Box Shadows ===
      boxShadow: {
        'glow-orange': 'var(--glow-orange)',
        'glow-pink': 'var(--glow-pink)',
        'glow-violet': 'var(--glow-violet)',
        'depth-1': 'var(--depth-1)',
        'depth-2': 'var(--depth-2)',
        'depth-3': 'var(--depth-3)',
        'depth-4': 'var(--depth-4)',
      },
      
      // === Background Images (Gradients) ===
      backgroundImage: {
        'gradient-luminous': 'var(--gradient-luminous)',
        'gradient-sunset': 'var(--gradient-sunset)',
        'gradient-cosmic': 'var(--gradient-cosmic)',
        'gradient-aurora': 'var(--gradient-aurora)',
        'gradient-surface': 'var(--gradient-surface)',
        'liquid-flow': 'var(--liquid-flow)',
        // Noise texture for depth
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      
      // === Animations ===
      animation: {
        'liquid-flow': 'liquid-flow 3s linear infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'liquid-flow': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '200%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 128, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 128, 0, 0.5), 0 0 60px rgba(233, 64, 85, 0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // === Transitions ===
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        spring: '500ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      // === Z-Index Scale ===
      zIndex: {
        'dropdown': '50',
        'sticky': '100',
        'modal': '200',
        'popover': '300',
        'toast': '400',
        'tooltip': '500',
        'max': '9999',
      },
    },
  },
  plugins: [
    // Custom plugin for glass utilities
    plugin(function({ addUtilities, addComponents }) {
      // Glass effect utilities
      addUtilities({
        '.glass': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid var(--glass-border)',
        },
        '.glass-subtle': {
          background: 'var(--glass-bg-subtle)',
          backdropFilter: 'blur(8px) saturate(150%)',
          WebkitBackdropFilter: 'blur(8px) saturate(150%)',
          border: '1px solid var(--glass-border)',
        },
        '.glass-strong': {
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(20px) saturate(200%)',
          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
          border: '1px solid var(--glass-border)',
        },
        '.text-luminous': {
          background: 'var(--gradient-luminous)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundSize: '200% auto',
        },
        '.text-luminous-animated': {
          background: 'var(--liquid-flow)',
          backgroundSize: '200% auto',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'liquid-flow 3s linear infinite',
        },
      });
      
      // Glass card component
      addComponents({
        '.card-glass': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'var(--glass-border-hover)',
            boxShadow: 'var(--depth-2)',
          },
        },
        '.btn-glass': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius)',
          padding: '0.5rem 1rem',
          fontWeight: '500',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          color: 'var(--foreground)',
          cursor: 'pointer',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'var(--glass-border-hover)',
            background: 'var(--glass-bg-strong)',
          },
          '&:focus-visible': {
            outline: '2px solid var(--ring)',
            outlineOffset: '2px',
          },
        },
      });
    }),
  ],
};

export default lumPreset;
