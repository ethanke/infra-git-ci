'use client';

import { useEffect, useCallback, useRef } from 'react';

type KeyCombo = string | string[];
type KeyHandler = (event: KeyboardEvent) => void;

interface UseKeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: 'window' | 'document' | React.RefObject<HTMLElement>;
}

/**
 * Parse a key combo string into modifier keys and the main key
 */
function parseKeyCombo(combo: string): {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
} {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim());
  const key = parts[parts.length - 1];

  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt') || parts.includes('option'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  };
}

/**
 * Check if the event matches the key combo
 */
function matchesKeyCombo(
  event: KeyboardEvent,
  combo: ReturnType<typeof parseKeyCombo>
): boolean {
  const key = event.key.toLowerCase();
  const code = event.code.toLowerCase();

  // Match the key (support both key and code)
  const keyMatches =
    key === combo.key ||
    code === combo.key ||
    code === `key${combo.key}` ||
    code === `digit${combo.key}`;

  // Match modifiers
  const ctrlMatches = combo.ctrl === (event.ctrlKey || event.metaKey);
  const altMatches = combo.alt === event.altKey;
  const shiftMatches = combo.shift === event.shiftKey;
  const metaMatches = combo.meta === event.metaKey;

  return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
}

/**
 * Hook for handling keyboard shortcuts
 * 
 * @example
 * ```tsx
 * // Single key combo
 * useKeyboardShortcut('ctrl+k', () => {
 *   openCommandPalette();
 * });
 * 
 * // Multiple key combos for same action
 * useKeyboardShortcut(['ctrl+s', 'cmd+s'], () => {
 *   save();
 * });
 * ```
 */
export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  handler: KeyHandler,
  options: UseKeyboardShortcutOptions = {}
): void {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = 'window',
  } = options;

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger in input/textarea unless explicitly allowed
      const tagName = (event.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea';
      const isContentEditable = (event.target as HTMLElement)?.isContentEditable;

      if (isInput || isContentEditable) {
        // Only allow certain combos in inputs (like Escape, or combos with Ctrl/Cmd)
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
        if (!hasModifier && event.key !== 'Escape') {
          return;
        }
      }

      const combos = Array.isArray(keyCombo) ? keyCombo : [keyCombo];

      for (const combo of combos) {
        const parsed = parseKeyCombo(combo);

        if (matchesKeyCombo(event, parsed)) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          handlerRef.current(event);
          break;
        }
      }
    },
    [enabled, keyCombo, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetElement: EventTarget;

    if (target === 'window') {
      targetElement = window;
    } else if (target === 'document') {
      targetElement = document;
    } else if (target && 'current' in target && target.current) {
      targetElement = target.current;
    } else {
      return;
    }

    targetElement.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

/**
 * Common keyboard shortcut presets
 */
export const KeyboardShortcuts = {
  SAVE: ['ctrl+s', 'cmd+s'],
  UNDO: ['ctrl+z', 'cmd+z'],
  REDO: ['ctrl+shift+z', 'cmd+shift+z', 'ctrl+y'],
  COPY: ['ctrl+c', 'cmd+c'],
  PASTE: ['ctrl+v', 'cmd+v'],
  CUT: ['ctrl+x', 'cmd+x'],
  SELECT_ALL: ['ctrl+a', 'cmd+a'],
  FIND: ['ctrl+f', 'cmd+f'],
  CLOSE: ['escape', 'esc'],
  COMMAND_PALETTE: ['ctrl+k', 'cmd+k'],
  NEW: ['ctrl+n', 'cmd+n'],
  OPEN: ['ctrl+o', 'cmd+o'],
} as const;
