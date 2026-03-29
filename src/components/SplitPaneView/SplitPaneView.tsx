import "./SplitPaneView.css";

import {
  Button,
  Checkbox,
  Content,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@fluffylabs/shared-ui";
import { ChevronDown, Ellipsis, PanelRight, X } from "lucide-react";
import { useCallback, useContext, useRef } from "react";
import { useVersionContext } from "../LocationProvider/VersionProvider";
import { type IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";
import { PdfProvider } from "../PdfProvider/PdfProvider";
import { PdfViewer } from "../PdfViewer/PdfViewer";
import { SelectionProvider } from "../SelectionProvider/SelectionProvider";
import { ScrollSyncBridge } from "../SplitPdfPane/SplitPdfPane";
import { useSplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";
import { ZoomSyncBridge } from "../ZoomSync/ZoomSync";

export function SplitPaneView() {
  const { version: mainVersion } = useVersionContext();
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;
  const {
    rightVersion,
    setRightVersion,
    deactivateSplit,
    isScrollLinked,
    setScrollLinked,
    setSidebarOverlayOpen,
    theme,
    setTheme,
  } = useSplitScreenContext();

  const versions = [
    ...Object.values(metadata.versions).filter(({ legacy }) => !legacy),
    ...(metadata.nightly ? [metadata.nightly] : []),
  ];

  const effectiveVersion = rightVersion ?? metadata.latest;
  const currentVersionInfo =
    metadata.nightly && effectiveVersion === metadata.nightly.hash
      ? metadata.nightly
      : (metadata.versions[effectiveVersion] ?? metadata.versions[metadata.latest]);

  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);

  const handleVersionSelect = useCallback(
    (newVersion: string) => {
      setRightVersion(newVersion);
    },
    [setRightVersion],
  );

  const handleOpenChange = (open: boolean) => {
    if (open) {
      requestAnimationFrame(() => {
        currentItemRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
      });
    }
  };

  const versionLabel = currentVersionInfo
    ? getShortVersionLabel(currentVersionInfo, metadata.latest, metadata.nightly?.hash)
    : "Select version";

  return (
    <div className="split-pane-view">
      <div className="split-pane-header">
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button variant="tertiary" forcedColorScheme="dark" className="split-header-btn justify-between min-w-0">
              <span className="truncate text-xs">{versionLabel}</span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            ref={dropdownContentRef}
            className="max-h-[60vh] overflow-y-auto"
            forcedColorScheme="dark"
          >
            <DropdownMenuRadioGroup value={effectiveVersion} onValueChange={handleVersionSelect}>
              {versions.map((version) => (
                <DropdownMenuRadioItem
                  value={version.hash}
                  key={version.hash}
                  ref={version.hash === effectiveVersion ? currentItemRef : null}
                >
                  <span className="w-full text-xs">
                    {getShortVersionLabel(version, metadata.latest, metadata.nightly?.hash)}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="tertiary"
          forcedColorScheme="dark"
          onClick={() => setSidebarOverlayOpen((prev) => !prev)}
          className="split-header-btn"
          title="Toggle sidebar"
        >
          <PanelRight className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" forcedColorScheme="dark" className="split-header-btn border-0">
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent forcedColorScheme="dark">
            <DropdownMenuItem
              className="flex items-center justify-between"
              onSelect={(e) => {
                e.preventDefault();
                setScrollLinked((prev) => !prev);
              }}
            >
              <span>Link scrolling</span>
              <Checkbox checked={isScrollLinked} className="h-3.5 w-3.5 ml-[25px]" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center justify-between" onSelect={deactivateSplit}>
              <span>Close split view</span>
              <X className="h-4 w-4 ml-[25px]" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="split-pane-content">
        <PdfProvider pdfUrl={urlGetters.pdf(effectiveVersion)} externalTheme={theme} onThemeChange={setTheme}>
          <SelectionProvider isolated={effectiveVersion === mainVersion}>
            <ScrollSyncBridge paneId="right" />
            <ZoomSyncBridge />
            <Content>
              <PdfViewer />
            </Content>
          </SelectionProvider>
        </PdfProvider>
      </div>
    </div>
  );
}

function getShortVersionLabel(
  version: { hash: string; date: string; name?: string },
  latest: string,
  nightly?: string,
) {
  const isNightly = version.hash === nightly;
  const isLatest = version.hash === latest;
  const date = new Date(version.date);

  let label = isNightly ? "Nightly" : isLatest ? "Latest" : "v";
  if (version.name && !isNightly) {
    label += `: ${version.name}`;
  }

  const shortHash = `${version.hash.substring(0, 3)}...${version.hash.substring(version.hash.length - 3)}`;
  return `${label} ${shortHash} (${date.toLocaleDateString()})`;
}
