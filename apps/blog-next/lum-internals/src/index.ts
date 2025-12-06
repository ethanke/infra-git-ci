/**
 * @lum-tools/lum-internals
 * 
 * Shared component library, design system, and utilities for lum.tools applications.
 * 
 * Features:
 * - Glass/Liquid/Isomorphic design system
 * - Radix UI primitives with glass variants
 * - Tailwind CSS preset with brand colors
 * - React hooks for common patterns
 * - Utility functions
 * 
 * @example
 * ```tsx
 * import { Button, Card } from '@lum-tools/lum-internals/components/ui';
 * import { cn, formatDate } from '@lum-tools/lum-internals/lib';
 * import { useMobile } from '@lum-tools/lum-internals/hooks';
 * import '@lum-tools/lum-internals/styles/globals.css';
 * ```
 */

// Components
export * from './components';
export * from './components/ui';

// Hooks
export * from './hooks';

// Library utilities
export * from './lib';
