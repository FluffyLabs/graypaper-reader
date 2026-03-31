import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Auto-cleanup @testing-library/react after each test
afterEach(() => {
  cleanup();
});

// Polyfill DOMMatrix which pdfjs-dist requires but jsdom doesn't provide
if (typeof globalThis.DOMMatrix === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: minimal polyfill for test environment
  globalThis.DOMMatrix = class DOMMatrix {} as any;
}

// Polyfill ResizeObserver for components that use it
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    // biome-ignore lint/suspicious/noExplicitAny: minimal polyfill for test environment
  } as any;
}

// Polyfill matchMedia for hooks that use media queries
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Ensure localStorage is available (jsdom sometimes fails to provide it)
if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.getItem !== "function") {
  const storage = new Map<string, string>();
  const localStoragePolyfill = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size;
    },
    key: (index: number) => [...storage.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, "localStorage", { value: localStoragePolyfill, writable: true });
  Object.defineProperty(window, "localStorage", { value: localStoragePolyfill, writable: true });
}
