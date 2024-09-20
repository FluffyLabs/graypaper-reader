import { useEffect, useRef } from "react";

// biome-ignore lint/suspicious/noExplicitAny: we must accept any generic function
export function useThrottle(callback: (...args: any[]) => any, delayMs: number): (...args: any[]) => void {
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout>>();
  const lastCallDateRef = useRef<number>();
  // biome-ignore lint/suspicious/noExplicitAny: we must accept any generic function
  const callbackRef = useRef<(...args: any[]) => any>(callback); // biome-ignore lint/suspicious/noExplicitAny: we must accept any generic function
  const lastThisRef = useRef<any>();
  // biome-ignore lint/suspicious/noExplicitAny: we must accept any generic function
  const lastArgsRef = useRef<any[]>([]);

  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // biome-ignore lint/suspicious/noExplicitAny: we must accept any generic function
  return function (this: any, ...args) {
    const callDate = Date.now();

    if (!lastCallDateRef.current || Date.now() - lastCallDateRef.current >= delayMs) {
      callbackRef.current.apply(this, args);
      lastCallDateRef.current = callDate;
    } else if (timeoutIdRef.current) {
      lastArgsRef.current = args;
      lastThisRef.current = this;
    } else {
      lastArgsRef.current = args;
      lastThisRef.current = this;

      timeoutIdRef.current = setTimeout(() => {
        lastCallDateRef.current = Date.now();
        callbackRef.current.apply(lastThisRef.current, lastArgsRef.current);
        timeoutIdRef.current = undefined;
      }, delayMs);
    }
  };
}
