import { useCallback, useEffect, useRef, useState } from "react";

const FILTERED_NOTE_ALERT_MS = 6_000;

export const useFilteredNoteAlert = () => {
  const [noteAlertVisibilityState, setNoteAlertVisibilityState] = useState<
    "hidden" | "visibleForCreated" | "visibleForUpdated"
  >("hidden");
  const alertTimeoutRef = useRef<number | null>(null);

  const triggerFilteredNoteAlert = useCallback((type: "visibleForCreated" | "visibleForUpdated") => {
    setNoteAlertVisibilityState(type);
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
    alertTimeoutRef.current = window.setTimeout(() => {
      setNoteAlertVisibilityState("hidden");
    }, FILTERED_NOTE_ALERT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  const closeNoteAlert = useCallback(() => {
    setNoteAlertVisibilityState("hidden");
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
  }, []);

  return { noteAlertVisibilityState, triggerFilteredNoteAlert, closeNoteAlert };
};
