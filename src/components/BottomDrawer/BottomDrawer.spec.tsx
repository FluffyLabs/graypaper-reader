import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BottomDrawer } from "./BottomDrawer";

// Mock Sidebar to avoid deep dependency trees
vi.mock("../Sidebar/Sidebar", () => ({
  Sidebar: () => <div data-testid="mock-sidebar">Sidebar</div>,
}));

describe("BottomDrawer", () => {
  it("renders collapsed by default", () => {
    render(<BottomDrawer />);
    const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });
    expect(handle).toBeDefined();
    expect(handle.getAttribute("aria-expanded")).toBe("false");
  });

  it("expands on handle click", () => {
    render(<BottomDrawer />);
    const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

    fireEvent.click(handle);

    expect(handle.getAttribute("aria-expanded")).toBe("true");
    expect(handle.getAttribute("aria-label")).toBe("Collapse sidebar drawer");
  });

  it("collapses on second handle click", () => {
    render(<BottomDrawer />);
    const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

    fireEvent.click(handle); // expand
    fireEvent.click(handle); // collapse

    expect(handle.getAttribute("aria-expanded")).toBe("false");
    expect(handle.getAttribute("aria-label")).toBe("Expand sidebar drawer");
  });

  it("has correct CSS class when collapsed", () => {
    const { container } = render(<BottomDrawer />);
    const drawer = container.querySelector(".bottom-drawer");
    expect(drawer?.classList.contains("collapsed")).toBe(true);
    expect(drawer?.classList.contains("expanded")).toBe(false);
  });

  it("has correct CSS class when expanded", () => {
    const { container } = render(<BottomDrawer />);
    const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

    fireEvent.click(handle);

    const drawer = container.querySelector(".bottom-drawer");
    expect(drawer?.classList.contains("expanded")).toBe(true);
    expect(drawer?.classList.contains("collapsed")).toBe(false);
  });

  describe("swipe gestures", () => {
    it("expands on upward swipe exceeding threshold", () => {
      render(<BottomDrawer />);
      const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

      // Swipe up: clientY goes from 200 to 100 (deltaY = -100, exceeds -50 threshold)
      fireEvent.touchStart(handle, { touches: [{ clientY: 200 }] });
      fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 100 }] });

      expect(handle.getAttribute("aria-expanded")).toBe("true");
    });

    it("does not expand on small upward swipe", () => {
      render(<BottomDrawer />);
      const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

      // Swipe up: clientY goes from 200 to 180 (deltaY = -20, below threshold)
      fireEvent.touchStart(handle, { touches: [{ clientY: 200 }] });
      fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 180 }] });

      expect(handle.getAttribute("aria-expanded")).toBe("false");
    });

    it("collapses on downward swipe exceeding threshold", () => {
      render(<BottomDrawer />);
      const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

      // First expand
      fireEvent.click(handle);
      expect(handle.getAttribute("aria-expanded")).toBe("true");

      // Swipe down: clientY goes from 100 to 200 (deltaY = 100, exceeds 50 threshold)
      fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
      fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 200 }] });

      expect(handle.getAttribute("aria-expanded")).toBe("false");
    });

    it("does not collapse on small downward swipe", () => {
      render(<BottomDrawer />);
      const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

      // First expand
      fireEvent.click(handle);

      // Swipe down: clientY goes from 100 to 130 (deltaY = 30, below threshold)
      fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
      fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 130 }] });

      expect(handle.getAttribute("aria-expanded")).toBe("true");
    });

    it("does not expand on downward swipe when collapsed", () => {
      render(<BottomDrawer />);
      const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });

      // Swipe down when already collapsed
      fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
      fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 200 }] });

      expect(handle.getAttribute("aria-expanded")).toBe("false");
    });
  });

  it("has aria-controls pointing to drawer content", () => {
    render(<BottomDrawer />);
    const handle = screen.getByRole("button", { name: "Expand sidebar drawer" });
    expect(handle.getAttribute("aria-controls")).toBe("bottom-drawer-content");
  });
});
