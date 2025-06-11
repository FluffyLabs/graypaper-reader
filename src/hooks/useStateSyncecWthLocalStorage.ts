import { useCallback, useState } from "react";

export function useStateSyncedWithLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    try {
      return storedValue ? JSON.parse(storedValue) : initialValue;
    } catch (error) {
      console.error(`Error parsing localStorage item "${key}":`, error);
      return initialValue;
    }
  });

  const setSyncedState = useCallback(
    (value: T) => {
      setState(value);
      localStorage.setItem(key, JSON.stringify(value));
    },
    [key],
  );

  return [state, setSyncedState];
}
