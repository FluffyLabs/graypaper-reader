import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";
import { type ISplitScreenContext, SplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";
import { ZoomSyncBridge } from "./ZoomSync";

function createPdfContext(overrides: Partial<IPdfContext> = {}): IPdfContext {
  return {
    viewer: undefined,
    setViewer: vi.fn(),
    scale: 1.0,
    theme: "dark",
    setTheme: vi.fn(),
    visiblePages: [],
    pageOffsets: { current: [] },
    downloadPdfWithTheme: vi.fn(),
    textLayerRenderedRef: { current: [] },
    ...overrides,
  } as IPdfContext;
}

function createSplitContext(overrides: Partial<ISplitScreenContext> = {}): ISplitScreenContext {
  return {
    isSplitActive: true,
    activateSplit: vi.fn(),
    activateCompare: vi.fn(),
    deactivateSplit: vi.fn(),
    rightVersion: "abc123",
    setRightVersion: vi.fn(),
    isScrollLinked: false,
    setScrollLinked: vi.fn(),
    scrollSyncTarget: null,
    setScrollSyncTarget: vi.fn(),
    isSidebarOverlayOpen: false,
    setSidebarOverlayOpen: vi.fn(),
    theme: "dark",
    setTheme: vi.fn(),
    sharedScale: 1.0,
    setSharedScale: vi.fn(),
    ...overrides,
  };
}

function renderBridge(pdfCtx: IPdfContext, splitCtx: ISplitScreenContext) {
  return render(
    <PdfContext.Provider value={pdfCtx}>
      <SplitScreenContext.Provider value={splitCtx}>
        <ZoomSyncBridge />
      </SplitScreenContext.Provider>
    </PdfContext.Provider>,
  );
}

describe("ZoomSyncBridge", () => {
  it("publishes local scale to sharedScale when split is active", () => {
    const setSharedScale = vi.fn();
    const pdfCtx = createPdfContext({ scale: 1.5 });
    const splitCtx = createSplitContext({ isSplitActive: true, setSharedScale });

    renderBridge(pdfCtx, splitCtx);

    expect(setSharedScale).toHaveBeenCalledWith(1.5);
  });

  it("does not publish when split is inactive", () => {
    const setSharedScale = vi.fn();
    const pdfCtx = createPdfContext({ scale: 1.5 });
    const splitCtx = createSplitContext({ isSplitActive: false, setSharedScale });

    renderBridge(pdfCtx, splitCtx);

    expect(setSharedScale).not.toHaveBeenCalled();
  });

  it("does not publish when scale is falsy", () => {
    const setSharedScale = vi.fn();
    const pdfCtx = createPdfContext({ scale: 0 });
    const splitCtx = createSplitContext({ isSplitActive: true, setSharedScale });

    renderBridge(pdfCtx, splitCtx);

    expect(setSharedScale).not.toHaveBeenCalled();
  });

  it("consumes sharedScale and applies to viewer", () => {
    const mockViewer = { currentScale: 1.0, currentScaleValue: "1.0" };
    const pdfCtx = createPdfContext({ viewer: mockViewer as never, scale: 1.0 });
    const splitCtx = createSplitContext({ isSplitActive: true, sharedScale: 2.0 });

    renderBridge(pdfCtx, splitCtx);

    expect(mockViewer.currentScaleValue).toBe("2");
  });

  it("does not apply sharedScale when difference is negligible", () => {
    const mockViewer = { currentScale: 1.0, currentScaleValue: "1.0" };
    const pdfCtx = createPdfContext({ viewer: mockViewer as never, scale: 1.0 });
    const splitCtx = createSplitContext({ isSplitActive: true, sharedScale: 1.0005 });

    renderBridge(pdfCtx, splitCtx);

    expect(mockViewer.currentScaleValue).toBe("1.0");
  });

  it("does not consume when viewer is absent", () => {
    const pdfCtx = createPdfContext({ viewer: undefined, scale: 1.0 });
    const splitCtx = createSplitContext({ isSplitActive: true, sharedScale: 2.0 });

    // Should not throw
    expect(() => renderBridge(pdfCtx, splitCtx)).not.toThrow();
  });

  it("renders nothing", () => {
    const pdfCtx = createPdfContext();
    const splitCtx = createSplitContext();

    const { container } = renderBridge(pdfCtx, splitCtx);

    expect(container.innerHTML).toBe("");
  });
});
