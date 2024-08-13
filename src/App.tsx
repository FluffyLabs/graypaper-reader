import { useMemo, useState } from "react";
import "./App.css";
// import { Outline } from "./components/Outline/Outline";
// import { Selection } from "./components/Selection/Selection";
// import { Tabs } from "./components/Tabs/Tabs";
// import {
//   IframeController,
//   type InDocLocation,
//   type InDocSelection,
//   type Outline as OutlineType,
// } from "./utils/IframeController";

import grayPaperMetadata from "../public/metadata.json";
import { Banner } from "./components/Banner/Banner";
// import { Notes } from "./components/Notes/Notes";
// import { ThemeToggler } from "./components/ThemeToggler/ThemeToggler";
import { PdfViewer } from "./components/PdfViewer/PdfViewer";
import { type Metadata, Version } from "./components/Version/Version";
import { getLatestVersion } from "./components/Version/util";
import { deserializeLocation } from "./utils/location";

export function App() {
  // const frame = useRef(null as HTMLIFrameElement | null);
  // const [loadedFrame, setLoadedFrame] = useState(null as IframeController | null);
  const [version, setVersion] = useState(getInitialVersion());
  const { pdfUrl, synctexUrl } = useMemo(() => {
    return {
      pdfUrl: `graypaper-${version}.pdf`,
      synctexUrl: `graypaper-${version}.synctex.json`,
    };
  }, [version]);

  return (
    <>
      {/* {loadedFrame && <ThemeToggler iframeCtrl={loadedFrame} />} */}
      <div className="pdf-viewer-container">
        <PdfViewer pdfUrl={pdfUrl} synctexUrl={synctexUrl} />
      </div>
      <Banner />
      <div id="js-debug" style={{ display: "none", position: "absolute", backgroundColor: "#f00" }} />
      {<Viewer selectedVersion={version} onVersionChange={setVersion} />}
    </>
  );
}

type ViewerProps = {
  selectedVersion: string;
  onVersionChange: (v: string) => void;
};

function Viewer({ selectedVersion, onVersionChange }: ViewerProps) {
  // const [location, setLocation] = useState({ page: "0" } as InDocLocation);
  // const [selection, setSelection] = useState(null as InDocSelection | null);
  // const [outline, setOutline] = useState([] as OutlineType);
  // const [tab, setTab] = useState("outline");

  // // perform one-time operations.
  // useEffect(() => {
  //   setOutline(iframeCtrl.getOutline());

  //   iframeCtrl.injectStyles();
  // }, [iframeCtrl]);

  // // maintain location within document
  // useEffect(() => {
  //   return iframeCtrl.trackMouseLocation((loc, sel) => {
  //     setLocation(loc);
  //     setSelection(sel);
  //   });
  // }, [iframeCtrl]);

  // // react to changes in hash location
  // useEffect(() => {
  //   const listener = (ev: HashChangeEvent) => {
  //     const [, shortVersion] = iframeCtrl.goToLocation(`#${ev.newURL.split("#")[1]}`);
  //     const versionToSelect = findVersion(shortVersion, grayPaperMetadata);
  //     if (versionToSelect) {
  //       onVersionChange(versionToSelect);
  //     }
  //   };
  //   // read current hash
  //   const [cleanup, shortVersion] = iframeCtrl.goToLocation(window.location.hash);
  //   const versionToSelect = findVersion(shortVersion, grayPaperMetadata);
  //   if (versionToSelect) {
  //     onVersionChange(versionToSelect);
  //   }
  //   setSelection(iframeCtrl.getSelection());

  //   // react to hash changes
  //   window.addEventListener("hashchange", listener);
  //   return () => {
  //     window.removeEventListener("hashchange", listener);
  //     if (cleanup) {
  //       cleanup();
  //     }
  //   };
  // }, [iframeCtrl, onVersionChange]);

  // const jumpTo = useCallback(
  //   (id: string) => {
  //     iframeCtrl.jumpTo(id);
  //   },
  //   [iframeCtrl],
  // );

  return (
    <div className="viewer">
      {/* <Selection
        version={selectedVersion}
        location={location}
        selection={selection}
        activeTab={tab}
        switchTab={setTab}
      />
      <Tabs
        tabs={tabsContent(outline, location, jumpTo, selection, selectedVersion)}
        activeTab={tab}
        switchTab={setTab}
      /> */}
      <Version onChange={onVersionChange} metadata={grayPaperMetadata} selectedVersion={selectedVersion} />
    </div>
  );
}

// function tabsContent(
//   outline: OutlineType,
//   location: InDocLocation,
//   jumpTo: () => void,
//   selection: InDocSelection | null,
//   version: string
// ) {
//   return [
//     {
//       name: "outline",
//       render: () => <Outline outline={outline} jumpTo={jumpTo} location={location} />,
//     },
//     {
//       name: "notes",
//       render: () => <Notes version={version} selection={selection} />,
//     },
//   ];
// }

function getInitialVersion(): string {
  const loc = deserializeLocation(window.location.hash);
  const version = findVersion(loc?.shortVersion ?? null, grayPaperMetadata);
  if (version) {
    return version;
  }

  return getLatestVersion(grayPaperMetadata);
}

function findVersion(shortVersion: string | null, metadata: Metadata) {
  if (!shortVersion) {
    return null;
  }

  return Object.keys(metadata.versions).find((v) => v.startsWith(shortVersion)) ?? null;
}
