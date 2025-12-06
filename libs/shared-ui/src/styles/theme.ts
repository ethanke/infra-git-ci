/**
 * Lum.tools Design System - CSS Custom Properties
 */

export const lumThemeCSS = `
:root {
  /* Brand Colors */
  --lum-orange: #FF8000;
  --lum-orange-light: #FF9933;
  --lum-orange-dark: #E67300;
  --lum-coral: #E94055;
  --lum-violet: #8A2BE2;
  
  /* Backgrounds */
  --color-background: #0A0A0A;
  --color-surface: #111111;
  --color-surface-elevated: #1A1A1A;
  --color-surface-hover: #222222;
  
  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A3A3A3;
  --color-text-muted: #666666;
  
  /* Borders */
  --color-border: #2A2A2A;
  --color-border-hover: #3A3A3A;
  
  /* Status */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-glow-orange: 0 0 24px rgba(255, 128, 0, 0.15);
  
  /* Gradients */
  --gradient-brand: linear-gradient(135deg, #FF8000 0%, #E94055 100%);
  --gradient-brand-hover: linear-gradient(135deg, #FF9933 0%, #F05066 100%);
  
  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}

/* Base styles */
body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility Classes */
.lum-text-primary { color: var(--color-text-primary); }
.lum-text-secondary { color: var(--color-text-secondary); }
.lum-text-muted { color: var(--color-text-muted); }
.lum-text-orange { color: var(--lum-orange); }
.lum-text-success { color: var(--color-success); }
.lum-text-warning { color: var(--color-warning); }
.lum-text-error { color: var(--color-error); }

.lum-bg-surface { background-color: var(--color-surface); }
.lum-bg-elevated { background-color: var(--color-surface-elevated); }

.lum-border { border-color: var(--color-border); }

/* Animation Keyframes */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-fade-in { animation: fade-in var(--transition-normal) ease-out; }
.animate-slide-up { animation: slide-up var(--transition-slow) ease-out; }
.animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
.animate-gradient { 
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

/* Focus styles for accessibility */
.lum-focus:focus-visible {
  outline: 2px solid var(--lum-orange);
  outline-offset: 2px;
}
`;

export const tailwindConfig = `
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'lum-orange': {
          DEFAULT: '#FF8000',
          50: '#FFF3E6',
          100: '#FFE0B3',
          200: '#FFCC80',
          300: '#FFB84D',
          400: '#FFA31A',
          500: '#FF8000',
          600: '#E67300',
          700: '#CC6600',
          800: '#B35900',
          900: '#994D00',
        },
        'lum-coral': '#E94055',
        'lum-violet': '#8A2BE2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'gradient': 'gradient-shift 8s ease infinite',
      },
    },
  },
}
`;
