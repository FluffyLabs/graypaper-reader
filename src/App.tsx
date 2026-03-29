import { useCallback, useContext } from "react";
import "./App.css";

import { AppsSidebar, Content, useBreakpoint } from "@fluffylabs/shared-ui";
import { BottomDrawer } from "./components/BottomDrawer/BottomDrawer";
import { CodeSyncProvider } from "./components/CodeSyncProvider/CodeSyncProvider";
import { DownloadModal } from "./components/DownloadModal/DownloadModal";
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
    <CodeSyncProvider>
      <NotesProvider>
        <SplitScreenProvider>
          <AppLayout />
        </SplitScreenProvider>
      </NotesProvider>
    </CodeSyncProvider>
  );
}

function AppLayout() {
  const isNarrow = useBreakpoint("(max-width: 768px)");
  const { isSplitActive, activateSplit, deactivateSplit } = useSplitScreenContext();

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

  return (
    <div>
      <Header />
      {isNarrow ? <NarrowLayout /> : <WideLayout />}
    </div>
  );
}

function PdfPaneContent() {
  return (
    <div className="h-full w-full flex flex-row items-stretch justify-center">
      <AppsSidebar activeLink="reader" enableDarkModeToggle={true} />
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
