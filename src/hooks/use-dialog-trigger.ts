import { useCallback, useRef, useState } from "react";

/**
 * Controlled-dialog state that returns keyboard focus to the triggering
 * button when the dialog closes (Escape, Cancel, or overlay click).
 */
export function useDialogTrigger<T extends HTMLElement = HTMLButtonElement>() {
  const triggerRef = useRef<T>(null);
  const [open, setOpen] = useState(false);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      // Run after Radix's own unmount-focus handling so the trigger keeps focus.
      requestAnimationFrame(() => {
        setTimeout(() => triggerRef.current?.focus(), 120);
      });
    }

  }, []);

  return { triggerRef, open, setOpen, onOpenChange };
}
