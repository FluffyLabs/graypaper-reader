import { useEffect, useRef } from "react";

// biome-ignore lint/suspicious/noExplicitAny: this hook can apply to any value
export function usePrevious(value: any) {
  const ref = useRef(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}
