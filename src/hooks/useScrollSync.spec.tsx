import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useScrollSyncConsumer, useScrollSyncPublisher } from "./useScrollSync";

function createMockViewer(opts: { pagesCount?: number; scrollTop?: number } = {}) {
  const { pagesCount = 3, scrollTop = 0 } = opts;
  const container = document.createElement("div");
  Object.defineProperty(container, "scrollTop", {
    get: () => scrollTop,
    set: vi.fn(),
    configurable: true,
  });
  Object.defineProperty(container, "scrollHeight", { value: 3000, configurable: true });
  Object.defineProperty(container, "clientHeight", { value: 500, configurable: true });

  const pages = Array.from({ length: pagesCount }, (_, i) => ({
    div: {
      offsetTop: i * 1000,
      offsetHeight: 1000,
    },
  }));

  return {
    container,
    pagesCount,
    getPageView: (i: number) => pages[i],
  };
}

describe("useScrollSyncPublisher", () => {
  it("returns a syncing ref", () => {
    const setTarget = vi.fn();
    const viewer = createMockViewer();
    const { result } = renderHook(() => useScrollSyncPublisher(viewer as never, "left", true, setTarget));

    expect(result.current).toHaveProperty("current");
    expect(result.current.current).toBe(false);
  });

  it("attaches scroll listener when enabled", () => {
    const setTarget = vi.fn();
    const viewer = createMockViewer();
    const addSpy = vi.spyOn(viewer.container, "addEventListener");

    renderHook(() => useScrollSyncPublisher(viewer as never, "left", true, setTarget));

    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
  });

  it("does not attach listener when disabled", () => {
    const setTarget = vi.fn();
    const viewer = createMockViewer();
    const addSpy = vi.spyOn(viewer.container, "addEventListener");

    renderHook(() => useScrollSyncPublisher(viewer as never, "left", false, setTarget));

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("publishes scroll position on scroll event", () => {
    const setTarget = vi.fn();
    const viewer = createMockViewer({ scrollTop: 1500 });

    renderHook(() => useScrollSyncPublisher(viewer as never, "left", true, setTarget));

    viewer.container.dispatchEvent(new Event("scroll"));

    expect(setTarget).toHaveBeenCalledWith({
      page: 2,
      yFraction: 0.5,
      sourcePane: "left",
    });
  });

  it("suppresses scroll events when isSyncing is true", () => {
    const setTarget = vi.fn();
    const viewer = createMockViewer({ scrollTop: 500 });

    const { result } = renderHook(() => useScrollSyncPublisher(viewer as never, "left", true, setTarget));

    result.current.current = true;
    viewer.container.dispatchEvent(new Event("scroll"));

    expect(setTarget).not.toHaveBeenCalled();
  });

  it("removes listener on cleanup", () => {
    const setTarget = vi.fn();
    const viewer = createMockViewer();
    const removeSpy = vi.spyOn(viewer.container, "removeEventListener");

    const { unmount } = renderHook(() => useScrollSyncPublisher(viewer as never, "left", true, setTarget));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});

describe("useScrollSyncConsumer", () => {
  it("ignores targets from the same pane", () => {
    const viewer = createMockViewer();
    const scrollTopSetter = vi.fn();
    Object.defineProperty(viewer.container, "scrollTop", {
      get: () => 0,
      set: scrollTopSetter,
      configurable: true,
    });
    const isSyncingRef = { current: false };

    renderHook(() =>
      useScrollSyncConsumer(
        viewer as never,
        "left",
        true,
        { page: 2, yFraction: 0.5, sourcePane: "left" },
        isSyncingRef,
      ),
    );

    expect(scrollTopSetter).not.toHaveBeenCalled();
  });

  it("scrolls to target position from other pane", () => {
    const viewer = createMockViewer();
    const scrollTopSetter = vi.fn();
    Object.defineProperty(viewer.container, "scrollTop", {
      get: () => 0,
      set: scrollTopSetter,
      configurable: true,
    });
    const isSyncingRef = { current: false };

    renderHook(() =>
      useScrollSyncConsumer(
        viewer as never,
        "left",
        true,
        { page: 2, yFraction: 0.5, sourcePane: "right" },
        isSyncingRef,
      ),
    );

    // page 2 → index 1 → offsetTop=1000, offsetHeight=1000
    // targetScroll = 1000 + 0.5 * 1000 = 1500
    expect(scrollTopSetter).toHaveBeenCalledWith(1500);
  });

  it("sets isSyncing flag to prevent feedback loops", () => {
    const viewer = createMockViewer();
    Object.defineProperty(viewer.container, "scrollTop", {
      get: () => 0,
      set: vi.fn(),
      configurable: true,
    });
    const isSyncingRef = { current: false };

    renderHook(() =>
      useScrollSyncConsumer(
        viewer as never,
        "left",
        true,
        { page: 1, yFraction: 0, sourcePane: "right" },
        isSyncingRef,
      ),
    );

    // The flag should be set synchronously
    expect(isSyncingRef.current).toBe(true);
  });

  it("does nothing when disabled", () => {
    const viewer = createMockViewer();
    const scrollTopSetter = vi.fn();
    Object.defineProperty(viewer.container, "scrollTop", {
      get: () => 0,
      set: scrollTopSetter,
      configurable: true,
    });
    const isSyncingRef = { current: false };

    renderHook(() =>
      useScrollSyncConsumer(
        viewer as never,
        "left",
        false,
        { page: 2, yFraction: 0.5, sourcePane: "right" },
        isSyncingRef,
      ),
    );

    expect(scrollTopSetter).not.toHaveBeenCalled();
  });

  it("does nothing when target is null", () => {
    const viewer = createMockViewer();
    const scrollTopSetter = vi.fn();
    Object.defineProperty(viewer.container, "scrollTop", {
      get: () => 0,
      set: scrollTopSetter,
      configurable: true,
    });
    const isSyncingRef = { current: false };

    renderHook(() => useScrollSyncConsumer(viewer as never, "left", true, null, isSyncingRef));

    expect(scrollTopSetter).not.toHaveBeenCalled();
  });

  it("ignores out-of-range page indices", () => {
    const viewer = createMockViewer({ pagesCount: 3 });
    const scrollTopSetter = vi.fn();
    Object.defineProperty(viewer.container, "scrollTop", {
      get: () => 0,
      set: scrollTopSetter,
      configurable: true,
    });
    const isSyncingRef = { current: false };

    renderHook(() =>
      useScrollSyncConsumer(
        viewer as never,
        "left",
        true,
        { page: 10, yFraction: 0.5, sourcePane: "right" },
        isSyncingRef,
      ),
    );

    expect(scrollTopSetter).not.toHaveBeenCalled();
  });
});
