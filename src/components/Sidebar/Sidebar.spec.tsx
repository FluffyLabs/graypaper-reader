import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ISplitScreenContext, SplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";
import { Sidebar } from "./Sidebar";

// Mock child components to avoid deep dependency trees
vi.mock("../Outline/Outline", () => ({
  Outline: () => <div data-testid="mock-outline">Outline</div>,
}));
vi.mock("../NoteManager/NoteManager", () => ({
  NoteManager: () => <div data-testid="mock-notes">Notes</div>,
}));
vi.mock("../Search/Search", () => ({
  Search: ({ onSearchFinished }: { onSearchFinished: (v: boolean) => void }) => {
    onSearchFinished(false);
    return <div data-testid="mock-search">Search</div>;
  },
}));

// Mock useBreakpoint from @fluffylabs/shared-ui
const mockUseBreakpoint = vi.fn(() => false);
vi.mock("@fluffylabs/shared-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useBreakpoint: (...args: unknown[]) => mockUseBreakpoint(...args),
  };
});

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

function renderSidebar(ctx: ISplitScreenContext) {
  return render(
    <SplitScreenContext.Provider value={ctx}>
      <Sidebar />
    </SplitScreenContext.Provider>,
  );
}

beforeEach(() => {
  mockUseBreakpoint.mockReturnValue(false); // default: wide screen
  localStorage.removeItem("gp-tab");
});

describe("Sidebar", () => {
  describe("split tab visibility", () => {
    it("shows split tab on wide screen when split is inactive", () => {
      mockUseBreakpoint.mockReturnValue(false); // not narrow
      const ctx = createSplitContext({ isSplitActive: false });
      renderSidebar(ctx);

      expect(screen.getByTestId("tab-split")).toBeDefined();
    });

    it("hides split tab on narrow screen", () => {
      mockUseBreakpoint.mockReturnValue(true); // narrow
      const ctx = createSplitContext({ isSplitActive: false });
      renderSidebar(ctx);

      expect(screen.queryByTestId("tab-split")).toBeNull();
    });

    it("hides split tab when split is already active", () => {
      mockUseBreakpoint.mockReturnValue(false); // wide
      const ctx = createSplitContext({ isSplitActive: true });
      renderSidebar(ctx);

      expect(screen.queryByTestId("tab-split")).toBeNull();
    });

    it("hides split tab on narrow screen even when split is inactive", () => {
      mockUseBreakpoint.mockReturnValue(true); // narrow
      const ctx = createSplitContext({ isSplitActive: false });
      renderSidebar(ctx);

      expect(screen.queryByTestId("tab-split")).toBeNull();
    });
  });

  describe("split tab activation", () => {
    it("calls activateSplit when split tab is clicked", () => {
      const activateSplit = vi.fn();
      const ctx = createSplitContext({ isSplitActive: false, activateSplit });
      renderSidebar(ctx);

      fireEvent.click(screen.getByTestId("tab-split"));

      expect(activateSplit).toHaveBeenCalled();
    });
  });

  describe("default tabs", () => {
    it("always renders outline, notes, and search tabs", () => {
      const ctx = createSplitContext();
      renderSidebar(ctx);

      expect(screen.getByTestId("tab-outline")).toBeDefined();
      expect(screen.getByTestId("tab-notes")).toBeDefined();
      expect(screen.getByTestId("tab-search")).toBeDefined();
    });

    it("defaults to outline tab", () => {
      localStorage.removeItem("gp-tab");
      const ctx = createSplitContext();
      renderSidebar(ctx);

      // Outline tab button should be disabled (active state)
      const outlineTab = screen.getByTestId("tab-outline");
      expect(outlineTab.hasAttribute("disabled")).toBe(true);
    });
  });

  describe("tab persistence", () => {
    it("stores active tab in localStorage", () => {
      const ctx = createSplitContext();
      renderSidebar(ctx);

      fireEvent.click(screen.getByTestId("tab-notes"));

      expect(localStorage.getItem("gp-tab")).toBe("notes");
    });

    it("restores tab from localStorage", () => {
      localStorage.setItem("gp-tab", "search");
      const ctx = createSplitContext();
      renderSidebar(ctx);

      const searchTab = screen.getByTestId("tab-search");
      expect(searchTab.hasAttribute("disabled")).toBe(true);
    });

    it("does not persist 'split' tab name to localStorage", () => {
      // The split tab triggers activateSplit instead of setting tab state,
      // so localStorage should not contain "split"
      const ctx = createSplitContext({ isSplitActive: false });
      renderSidebar(ctx);

      fireEvent.click(screen.getByTestId("tab-split"));

      expect(localStorage.getItem("gp-tab")).not.toBe("split");
    });
  });
});
