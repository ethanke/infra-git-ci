"use client"

import { useState, useEffect } from 'react'

/**
 * Custom hook to get the current window width with real-time updates
 * Optimized for performance with throttling and proper cleanup
 */
export function useWindowWidth() {
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    // Set initial width
    const updateWidth = () => {
      setWidth(window.innerWidth)
    }

    // Set initial value
    updateWidth()

    // Throttle function to limit how often we update
    let timeoutId: NodeJS.Timeout
    const throttledUpdateWidth = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateWidth, 16) // ~60fps throttling
    }

    // Add event listener
    window.addEventListener('resize', throttledUpdateWidth)

    // Cleanup
    return () => {
      window.removeEventListener('resize', throttledUpdateWidth)
      clearTimeout(timeoutId)
    }
  }, [])

  return width
}

/**
 * Custom hook to get breakpoint information based on Tailwind CSS breakpoints
 * Returns an object with boolean flags for each breakpoint
 */
export function useBreakpoints() {
  const width = useWindowWidth()

  return {
    width,
    isSm: width >= 640,   // sm: 640px
    isMd: width >= 768,   // md: 768px
    isLg: width >= 1024,  // lg: 1024px
    isXl: width >= 1280,  // xl: 1280px
    is2Xl: width >= 1536, // 2xl: 1536px
  }
}

/**
 * Custom hook for mobile detection
 * Returns true if the current width is below the 'sm' breakpoint (640px)
 */
export function useIsMobile() {
  const width = useWindowWidth()
  return width > 0 && width < 640
}
