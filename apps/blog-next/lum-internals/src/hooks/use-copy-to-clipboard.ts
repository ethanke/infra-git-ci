'use client';

import { useState, useCallback } from 'react';
import { copyToClipboard } from '../lib/utils';

interface UseCopyToClipboardOptions {
  timeout?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for copying text to clipboard with status tracking
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
} {
  const { timeout = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const success = await copyToClipboard(text);
        
        if (success) {
          setCopied(true);
          onSuccess?.();

          // Reset after timeout
          setTimeout(() => {
            setCopied(false);
          }, timeout);
        } else {
          throw new Error('Failed to copy to clipboard');
        }

        return success;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Copy failed');
        onError?.(err);
        return false;
      }
    },
    [timeout, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, reset };
}
