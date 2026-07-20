"use client";

import { useEffect } from "react";

export function useEscapeClose(enabled: boolean, onClose: () => void) {
  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector('[role="listbox"]')) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onClose]);
}
