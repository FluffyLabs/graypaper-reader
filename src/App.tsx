import { useCallback, useContext } from "react";
import "./App.css";

import { AppsSidebar, Content, useBreakpoint } from "@fluffylabs/shared-ui";
import { BottomDrawer } from "./components/BottomDrawer/BottomDrawer";
import { CodeSyncProvider } from "./components/CodeSyncProvider/CodeSyncProvider";
import { DownloadModal } from "./components/DownloadModal/DownloadModal";
import { FocusModeProvider, useFocusModeContext } from "./components/FocusModeProvider/FocusModeProvider";
import { Header } from "./components/Header/Header";
import { LightThemeToggle } from "./components/LightThemeToggle/LightThemeToggle";
import { useVersionContext } from "./components/LocationProvider/VersionProvider";
import { type IMetadataContext, MetadataContext } from "./components/MetadataProvider/MetadataProvider";
import { NotesProvider } from "./components/NotesProvider/NotesProvider";
import { PdfProvider } from "./components/PdfProvider/PdfProvider";
import { PdfViewer } from "./components/PdfViewer/PdfViewer";
import { Resizable } from "./components/Resizable/Resizable";
import { SelectionProvider } from "./components/SelectionProvider/SelectionProvider";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { SidebarOverlay } from "./components/SidebarOverlay/SidebarOverlay";
import { SplitPaneView } from "./components/SplitPaneView/SplitPaneView";
import { ScrollSyncBridge } from "./components/SplitPdfPane/SplitPdfPane";
import { SplitScreenProvider, useSplitScreenContext } from "./components/SplitScreenProvider/SplitScreenProvider";
import { ZoomControls } from "./components/ZoomControls/ZoomControls";
import { ZoomSyncBridge } from "./components/ZoomSync/ZoomSync";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";

export function App() {
  return (
    <FocusModeProvider>
      <CodeSyncProvider>
        <NotesProvider>
          <SplitScreenProvider>
            <AppLayout />
          </SplitScreenProvider>
        </NotesProvider>
      </CodeSyncProvider>
    </FocusModeProvider>
  );
}

function AppLayout() {
  const isNarrow = useBreakpoint("(max-width: 768px)");
  const { isSplitActive, activateSplit, deactivateSplit } = useSplitScreenContext();
  const { isFocusMode, toggleFocusMode } = useFocusModeContext();

  const handleToggleSplit = useCallback(() => {
    if (isNarrow) return;
    if (isSplitActive) {
      deactivateSplit();
    } else {
      activateSplit();
    }
  }, [isNarrow, isSplitActive, activateSplit, deactivateSplit]);

  useKeyboardShortcut({
    key: "\\",
    onKeyPress: handleToggleSplit,
  });

  useKeyboardShortcut({
    key: "f",
    onKeyPress: toggleFocusMode,
  });

  return (
    <div style={isFocusMode ? { "--header-height": "28px", "--controls-left": "14px" } as React.CSSProperties : undefined}>
      {!isFocusMode && <Header />}
      {isFocusMode && <FocusModeBar onExit={toggleFocusMode} />}
      {isNarrow ? <NarrowLayout /> : <WideLayout />}
    </div>
  );
}

function FocusModeBar({ onExit }: { onExit: () => void }) {
  return (
    <div className="flex items-center justify-end px-2 py-1 bg-[var(--card)] text-[var(--foreground)] text-xs border-b border-[var(--border)]">
      <button
        type="button"
        onClick={onExit}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--accent)] transition-colors cursor-pointer"
      >
        <span>Exit focus mode</span>
        <kbd className="ml-1 px-1 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] text-[10px] font-mono">
          F
        </kbd>
      </button>
    </div>
  );
}

function PdfPaneContent() {
  const { isFocusMode } = useFocusModeContext();

  return (
    <div className="h-full w-full flex flex-row items-stretch justify-center">
      {!isFocusMode && <AppsSidebar activeLink="reader" enableDarkModeToggle={true} />}
      <Content>
        <PdfViewer />
      </Content>
      <div className="controls">
        <LightThemeToggle />
        <DownloadModal />
        <ZoomControls />
      </div>
    </div>
  );
}

function WideLayout() {
  const { version } = useVersionContext();
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;
  const { isSplitActive, theme, setTheme } = useSplitScreenContext();

  // Right side: either SplitPaneView or Sidebar
  const rightContent = isSplitActive ? <SplitPaneView /> : <Sidebar />;

  return (
    <PdfProvider pdfUrl={urlGetters.pdf(version)} externalTheme={theme} onThemeChange={setTheme}>
      <SelectionProvider>
        {isSplitActive && <ScrollSyncBridge paneId="left" />}
        {isSplitActive && <ZoomSyncBridge />}
        <Resizable left={<PdfPaneContent />} right={rightContent} />
        {isSplitActive && <SidebarOverlay />}
      </SelectionProvider>
    </PdfProvider>
  );
}

function NarrowLayout() {
  const { version } = useVersionContext();
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;
  const { theme, setTheme } = useSplitScreenContext();

  return (
    <PdfProvider pdfUrl={urlGetters.pdf(version)} externalTheme={theme} onThemeChange={setTheme}>
      <SelectionProvider>
        <div className="narrow-layout">
          <PdfPaneContent />
          <BottomDrawer />
        </div>
      </SelectionProvider>
    </PdfProvider>
  );
}
