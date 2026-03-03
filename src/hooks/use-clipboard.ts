"use client";

import { useCallback, useState } from "react";

/**
 * Hook for clipboard operations with copied state feedback
 * @param timeout - Duration to show copied state in ms (default: 2000)
 */
export const useClipboard = (timeout = 2000) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    },
    [timeout],
  );

  return { copied, copy };
};
