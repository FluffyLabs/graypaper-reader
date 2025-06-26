import { useEffect } from "react";

interface UseKeyboardShortcutOptions {
  key: string;
  onKeyPress: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
  requiresNoModifiers?: boolean;
  ignoreWhenTyping?: boolean;
}

export function useKeyboardShortcut({
  key,
  onKeyPress,
  enabled = true,
  preventDefault = true,
  requiresNoModifiers = true,
  ignoreWhenTyping = true,
}: UseKeyboardShortcutOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      if (ignoreWhenTyping) {
        const isTyping = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";

        if (isTyping) {
          return;
        }
      }

      // Check if the pressed key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      // Check modifiers if required
      if (requiresNoModifiers) {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }
      }

      // Prevent default behavior if needed
      if (preventDefault) {
        event.preventDefault();
      }

      // Execute the callback
      onKeyPress();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, onKeyPress, enabled, preventDefault, requiresNoModifiers, ignoreWhenTyping]);
}
