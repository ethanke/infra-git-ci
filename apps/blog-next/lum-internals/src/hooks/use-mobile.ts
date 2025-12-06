'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile-sized
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    setIsMobile(mql.matches);

    // Listen for changes
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the current viewport matches a specific breakpoint
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };

    setMatches(mql.matches);
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks
 */
export function useIsSmall(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsMedium(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 767px)');
}

export function useIsLarge(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsXLarge(): boolean {
  return useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
}

export function useIs2XLarge(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}
