import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type ISplitScreenContext, SplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";
import { SidebarOverlay } from "./SidebarOverlay";

// Mock Sidebar to avoid deep dependency trees
vi.mock("../Sidebar/Sidebar", () => ({
  Sidebar: () => <div data-testid="mock-sidebar">Sidebar</div>,
}));

function createSplitContext(overrides: Partial<ISplitScreenContext> = {}): ISplitScreenContext {
  return {
    isSplitActive: false,
    activateSplit: vi.fn(),
    activateCompare: vi.fn(),
    deactivateSplit: vi.fn(),
    rightVersion: null,
    setRightVersion: vi.fn(),
    isScrollLinked: false,
    setScrollLinked: vi.fn(),
    scrollSyncTarget: null,
    setScrollSyncTarget: vi.fn(),
    isSidebarOverlayOpen: false,
    setSidebarOverlayOpen: vi.fn(),
    theme: "dark",
    setTheme: vi.fn(),
    sharedScale: 0.85,
    setSharedScale: vi.fn(),
    ...overrides,
  };
}

function renderOverlay(ctx: ISplitScreenContext) {
  return render(
    <SplitScreenContext.Provider value={ctx}>
      <SidebarOverlay />
    </SplitScreenContext.Provider>,
  );
}

describe("SidebarOverlay", () => {
  it("renders nothing when closed", () => {
    const ctx = createSplitContext({ isSidebarOverlayOpen: false });
    const { container } = renderOverlay(ctx);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when open", () => {
    const ctx = createSplitContext({ isSidebarOverlayOpen: true });
    renderOverlay(ctx);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Sidebar");
  });

  it("closes on Escape key", () => {
    const setSidebarOverlayOpen = vi.fn();
    const ctx = createSplitContext({ isSidebarOverlayOpen: true, setSidebarOverlayOpen });
    renderOverlay(ctx);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(setSidebarOverlayOpen).toHaveBeenCalledWith(false);
  });

  it("does not listen for Escape when closed", () => {
    const setSidebarOverlayOpen = vi.fn();
    const ctx = createSplitContext({ isSidebarOverlayOpen: false, setSidebarOverlayOpen });
    renderOverlay(ctx);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(setSidebarOverlayOpen).not.toHaveBeenCalled();
  });

  it("closes on backdrop click", () => {
    const setSidebarOverlayOpen = vi.fn();
    const ctx = createSplitContext({ isSidebarOverlayOpen: true, setSidebarOverlayOpen });
    const { container } = renderOverlay(ctx);

    const backdrop = container.querySelector(".sidebar-overlay-backdrop") as Element;
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop);

    expect(setSidebarOverlayOpen).toHaveBeenCalledWith(false);
  });

  it("closes on close button click", () => {
    const setSidebarOverlayOpen = vi.fn();
    const ctx = createSplitContext({ isSidebarOverlayOpen: true, setSidebarOverlayOpen });
    const { container } = renderOverlay(ctx);

    const closeButton = container.querySelector(".sidebar-overlay-header button") as Element;
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton);

    expect(setSidebarOverlayOpen).toHaveBeenCalledWith(false);
  });

  it("renders backdrop and panel when open", () => {
    const ctx = createSplitContext({ isSidebarOverlayOpen: true });
    const { container } = renderOverlay(ctx);

    expect(container.querySelector(".sidebar-overlay-backdrop")).not.toBeNull();
    expect(container.querySelector(".sidebar-overlay-panel")).not.toBeNull();
  });
});
