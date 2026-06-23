type ReadableStreamIteratorOptions = {
  preventCancel?: boolean;
};

type ReadableStreamPrototypeWithIterator = ReadableStream<unknown> & {
  values?: <T>(this: ReadableStream<T>, options?: ReadableStreamIteratorOptions) => AsyncIterableIterator<T>;
  [Symbol.asyncIterator]?: <T>(this: ReadableStream<T>) => AsyncIterableIterator<T>;
};

function readableStreamValues<T>(
  this: ReadableStream<T>,
  options: ReadableStreamIteratorOptions = {},
): AsyncIterableIterator<T> {
  const reader = this.getReader();
  let isDone = false;

  const iterator: AsyncIterableIterator<T> = {
    async next() {
      if (isDone) {
        return { done: true, value: undefined as T };
      }

      const result = await reader.read();
      if (result.done) {
        isDone = true;
        reader.releaseLock();
        return { done: true, value: undefined as T };
      }

      return { done: false, value: result.value };
    },

    async return(value?: unknown) {
      if (!isDone) {
        isDone = true;
        try {
          if (!options.preventCancel) {
            await reader.cancel(value);
          }
        } finally {
          reader.releaseLock();
        }
      }

      return { done: true, value: value as T };
    },

    [Symbol.asyncIterator]() {
      return this;
    },
  };

  return iterator;
}

/**
 * Polyfill `ReadableStream` async iteration for Safari versions that expose streams but not
 * `ReadableStream.prototype[Symbol.asyncIterator]` / `.values()`.
 *
 * pdf.js' `PDFPageProxy.getTextContent` consumes text streams with `for await (... of stream)`.
 * Without this API Safari throws `TypeError: undefined is not a function` and search indexing
 * fails with "Unable to get text content for page ...".
 */
export function installReadableStreamAsyncIteratorPolyfill(): void {
  if (typeof ReadableStream === "undefined" || typeof Symbol.asyncIterator === "undefined") {
    return;
  }

  const prototype = ReadableStream.prototype as ReadableStreamPrototypeWithIterator;

  if (typeof prototype.values !== "function") {
    Object.defineProperty(prototype, "values", {
      configurable: true,
      writable: true,
      value: readableStreamValues,
    });
  }

  if (typeof prototype[Symbol.asyncIterator] !== "function") {
    Object.defineProperty(prototype, Symbol.asyncIterator, {
      configurable: true,
      writable: true,
      value: prototype.values,
    });
  }
}
