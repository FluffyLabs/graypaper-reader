import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import type { ILocationParams } from "../LocationProvider/types";
import { SplitScreenProvider, useSplitScreenContext } from "./SplitScreenProvider";

function createWrapper(locationParams: ILocationParams, setLocationParams = vi.fn()) {
  const locationCtx: ILocationContext = {
    locationParams,
    setLocationParams,
    synctexBlocksToSelectionParams: vi.fn(),
    getHashFromLocationParams: vi.fn(),
  };

  return {
    setLocationParams,
    wrapper: ({ children }: { children: ReactNode }) => (
      <LocationContext.Provider value={locationCtx}>
        <SplitScreenProvider>{children}</SplitScreenProvider>
      </LocationContext.Provider>
    ),
  };
}

describe("SplitScreenProvider", () => {
  describe("isSplitActive / rightVersion derived state", () => {
    it("is inactive when split is absent", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });
      expect(result.current.isSplitActive).toBe(false);
      expect(result.current.rightVersion).toBeNull();
    });

    it("is active when split is set", () => {
      const { wrapper } = createWrapper({ version: "abc123", split: "def456" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });
      expect(result.current.isSplitActive).toBe(true);
      expect(result.current.rightVersion).toBe("def456");
    });
  });

  describe("activateSplit", () => {
    it("sets split to the current version", () => {
      const { wrapper, setLocationParams } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.activateSplit());

      expect(setLocationParams).toHaveBeenCalledWith(expect.objectContaining({ version: "abc123", split: "abc123" }));
    });

    it("disables scroll linking", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.activateSplit());

      expect(result.current.isScrollLinked).toBe(false);
    });

    it("closes sidebar overlay", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setSidebarOverlayOpen(true));
      act(() => result.current.activateSplit());

      expect(result.current.isSidebarOverlayOpen).toBe(false);
    });
  });

  describe("activateCompare", () => {
    it("does not change scroll linking state", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      expect(result.current.isScrollLinked).toBe(false);
      act(() => result.current.activateCompare("def456"));
      expect(result.current.isScrollLinked).toBe(false);
    });

    it("sets split to the target version", () => {
      const { wrapper, setLocationParams } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.activateCompare("def456"));

      expect(setLocationParams).toHaveBeenCalledWith(expect.objectContaining({ split: "def456" }));
    });

    it("closes sidebar overlay", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setSidebarOverlayOpen(true));
      act(() => result.current.activateCompare("def456"));

      expect(result.current.isSidebarOverlayOpen).toBe(false);
    });
  });

  describe("deactivateSplit", () => {
    it("removes split from location params", () => {
      const { wrapper, setLocationParams } = createWrapper({
        version: "abc123",
        split: "def456",
      });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.deactivateSplit());

      const call = setLocationParams.mock.calls[0][0];
      expect(call).not.toHaveProperty("split");
      expect(call.version).toBe("abc123");
    });

    it("disables scroll linking", () => {
      const { wrapper } = createWrapper({ version: "abc123", split: "def456" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setScrollLinked(true));
      act(() => result.current.deactivateSplit());

      expect(result.current.isScrollLinked).toBe(false);
    });

    it("closes sidebar overlay", () => {
      const { wrapper } = createWrapper({ version: "abc123", split: "def456" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setSidebarOverlayOpen(true));
      act(() => result.current.deactivateSplit());

      expect(result.current.isSidebarOverlayOpen).toBe(false);
    });
  });

  describe("setRightVersion", () => {
    it("preserves current scroll linking state", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      expect(result.current.isScrollLinked).toBe(false);
      act(() => result.current.setRightVersion("def456"));
      expect(result.current.isScrollLinked).toBe(false);

      act(() => result.current.setScrollLinked(true));
      act(() => result.current.setRightVersion("ghi789"));
      expect(result.current.isScrollLinked).toBe(true);
    });

    it("deactivates split when set to null", () => {
      const { wrapper, setLocationParams } = createWrapper({
        version: "abc123",
        split: "def456",
      });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setRightVersion(null));

      const call = setLocationParams.mock.calls[0][0];
      expect(call).not.toHaveProperty("split");
    });
  });

  describe("theme", () => {
    it("defaults to dark when localStorage is empty", () => {
      localStorage.removeItem("theme");
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });
      expect(result.current.theme).toBe("dark");
    });

    it("persists theme changes to localStorage", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setTheme("light"));

      expect(result.current.theme).toBe("light");
      expect(localStorage.getItem("theme")).toBe("light");
    });
  });

  describe("sharedScale", () => {
    it("defaults to 0.85", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });
      expect(result.current.sharedScale).toBe(0.85);
    });

    it("updates shared scale", () => {
      const { wrapper } = createWrapper({ version: "abc123" });
      const { result } = renderHook(() => useSplitScreenContext(), { wrapper });

      act(() => result.current.setSharedScale(1.5));

      expect(result.current.sharedScale).toBe(1.5);
    });
  });
});
