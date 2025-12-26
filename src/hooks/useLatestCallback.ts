import { type RefObject, useRef } from "react";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function useLatestCallback<T extends (...args: any[]) => any>(callback: T): RefObject<T> {
  const ref = useRef(callback);
  ref.current = callback;
  return ref;
}
