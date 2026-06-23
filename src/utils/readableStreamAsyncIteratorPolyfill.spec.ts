import { afterEach, describe, expect, it } from "vitest";
import { installReadableStreamAsyncIteratorPolyfill } from "./readableStreamAsyncIteratorPolyfill";

const readableStreamPrototype = ReadableStream.prototype as ReadableStream<unknown> & {
  values?: (options?: { preventCancel?: boolean }) => AsyncIterableIterator<unknown>;
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<unknown>;
};

const originalValues = Object.getOwnPropertyDescriptor(readableStreamPrototype, "values");
const originalAsyncIterator = Object.getOwnPropertyDescriptor(readableStreamPrototype, Symbol.asyncIterator);

function restoreProperty(property: "values" | typeof Symbol.asyncIterator, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) {
    Object.defineProperty(readableStreamPrototype, property, descriptor);
  } else {
    delete readableStreamPrototype[property];
  }
}

async function collectStreamValues<T>(stream: ReadableStream<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of stream) {
    values.push(value);
  }
  return values;
}

describe("installReadableStreamAsyncIteratorPolyfill", () => {
  afterEach(() => {
    restoreProperty("values", originalValues);
    restoreProperty(Symbol.asyncIterator, originalAsyncIterator);
  });

  it("adds async iteration support when ReadableStream.values and Symbol.asyncIterator are missing", async () => {
    Reflect.deleteProperty(readableStreamPrototype, "values");
    Reflect.deleteProperty(readableStreamPrototype, Symbol.asyncIterator);

    installReadableStreamAsyncIteratorPolyfill();

    expect(typeof readableStreamPrototype.values).toBe("function");
    expect(typeof readableStreamPrototype[Symbol.asyncIterator]).toBe("function");
    expect(
      await collectStreamValues(
        new ReadableStream<string>({
          start(controller) {
            controller.enqueue("hello");
            controller.enqueue("safari");
            controller.close();
          },
        }),
      ),
    ).toEqual(["hello", "safari"]);
  });

  it("does not overwrite native implementations", () => {
    const values = function* values() {};
    const asyncIterator = function* asyncIterator() {};

    Object.defineProperty(readableStreamPrototype, "values", {
      configurable: true,
      writable: true,
      value: values,
    });
    Object.defineProperty(readableStreamPrototype, Symbol.asyncIterator, {
      configurable: true,
      writable: true,
      value: asyncIterator,
    });

    installReadableStreamAsyncIteratorPolyfill();

    expect(readableStreamPrototype.values).toBe(values);
    expect(readableStreamPrototype[Symbol.asyncIterator]).toBe(asyncIterator);
  });
});
