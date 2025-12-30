import { useCallback, useEffect, useRef, useState } from "react";

const FILTERED_NOTE_ALERT_MS = 6_000;

export const useFilteredNoteAlert = () => {
  const [noteAlertVisibilityState, setNoteAlertVisibiltyState] = useState<
    "hidden" | "visibleForCreated" | "visibleForUpdated"
  >("hidden");
  const alertTimeoutRef = useRef<number | null>(null);

  const triggerFilteredNoteAlert = useCallback((type: "visibleForCreated" | "visibleForUpdated") => {
    setNoteAlertVisibiltyState(type);
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
    alertTimeoutRef.current = window.setTimeout(() => {
      setNoteAlertVisibiltyState("hidden");
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
    setNoteAlertVisibiltyState("hidden");
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
  }, []);

  return { noteAlertVisibilityState, triggerFilteredNoteAlert, closeNoteAlert };
};
