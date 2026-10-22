'use client';

import { useEffect } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyBindings {
  [key: string]: KeyHandler;
}

/**
 * Universal Keyboard & TV Remote Control hook.
 * Maps standard keyboard shortcuts and Android TV / Fire TV D-Pad buttons:
 * - D-Pad: ArrowUp, ArrowDown, ArrowLeft, ArrowRight
 * - Select: Enter / Ok / Space
 * - Back: Escape / Backspace / GoBack
 * - Media: MediaPlayPause, MediaPlay, MediaPause, MediaFastForward, MediaRewind
 */
export function useKeyboard(bindings: KeyBindings, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is actively typing in a form input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        if (event.key === 'Escape') {
          (event.target as HTMLElement).blur();
        }
        return;
      }

      const key = event.key.toLowerCase();
      const code = event.code?.toLowerCase();
      
      const handler = bindings[key] || (code ? bindings[code] : undefined);
      
      if (handler) {
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings, enabled]);
}
