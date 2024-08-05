import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { Outline } from "./components/Outline/Outline";
import { Selection } from "./components/Selection/Selection";
import { Tabs } from "./components/Tabs/Tabs";
import {
  IframeController,
  type InDocLocation,
  type InDocSelection,
  type Outline as OutlineType,
} from "./utils/IframeController";

import grayPaperMetadata from "../public/metadata.json";
import { Banner } from "./components/Banner/Banner";
import { Notes } from "./components/Notes/Notes";
import { Version } from "./components/Version/Version";
import { getLatestVersion } from "./components/Version/util";
import { deserializeLocation } from "./utils/location";

export function App() {
  const frame = useRef(null as HTMLIFrameElement | null);
  const [loadedFrame, setLoadedFrame] = useState(null as IframeController | null);
  const [version, setVersion] = useState(getInitialVersion());

  // wait for the iframe content to load.
  useEffect(() => {
    const interval = setInterval(() => {
      const win = frame.current?.contentWindow;
      if (win) {
        // first add listener
        win.addEventListener("load", () => {
          setLoadedFrame(new IframeController(win, version));
        });
        // and then check ready state to avoid race condition
        if (win.document.readyState === "complete") {
          setLoadedFrame(new IframeController(win, version));
        }
        clearInterval(interval);
      }
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [version]);

  return (
    <>
      <Banner />
      <iframe title="Gray Paper" name="gp" ref={frame} src={`graypaper-${version}.html`} />
      {loadedFrame && <Viewer selectedVersion={version} onVersionChange={setVersion} iframeCtrl={loadedFrame} />}
    </>
  );
}

type ViewerProps = {
  iframeCtrl: IframeController;
  selectedVersion: string;
  onVersionChange: (v: string) => void;
};

function Viewer({ iframeCtrl, selectedVersion, onVersionChange }: ViewerProps) {
  const [location, setLocation] = useState({ page: "0" } as InDocLocation);
  const [selection, setSelection] = useState(null as InDocSelection | null);
  const [outline, setOutline] = useState([] as OutlineType);
  const [tab, setTab] = useState("outline");

  // perform one-time operations.
  useEffect(() => {
    setOutline(iframeCtrl.getOutline());

    iframeCtrl.injectStyles();
    iframeCtrl.toggleSidebar(false);
  }, [iframeCtrl]);

  // maintain location within document
  useEffect(() => {
    return iframeCtrl.trackMouseLocation((loc, sel) => {
      setLocation(loc);
      setSelection(sel);
    });
  }, [iframeCtrl]);

  // react to changes in hash location
  useEffect(() => {
    const listener = (ev: HashChangeEvent) => {
      const [, versionToSelect] = iframeCtrl.goToLocation(`#${ev.newURL.split("#")[1]}`);
      if (versionToSelect) {
        onVersionChange(versionToSelect);
      }
    };
    // read current hash
    const [cleanup, versionToSelect] = iframeCtrl.goToLocation(window.location.hash);
    if (versionToSelect) {
      onVersionChange(versionToSelect);
    }
    setSelection(iframeCtrl.getSelection());

    // react to hash changes
    window.addEventListener("hashchange", listener);
    return () => {
      window.removeEventListener("hashchange", listener);
      if (cleanup) {
        cleanup();
      }
    };
  }, [iframeCtrl, onVersionChange]);

  const jumpTo = useCallback(
    (id: string) => {
      iframeCtrl.jumpTo(id);
    },
    [iframeCtrl],
  );

  return (
    <div className="viewer">
      <Selection
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
      />
      <Version onChange={onVersionChange} metadata={grayPaperMetadata} selectedVersion={selectedVersion} />
    </div>
  );
}

function tabsContent(
  outline: OutlineType,
  location: InDocLocation,
  jumpTo: (id: string) => void,
  selection: InDocSelection | null,
  version: string,
) {
  return [
    {
      name: "outline",
      render: () => <Outline outline={outline} jumpTo={jumpTo} location={location} />,
    },
    {
      name: "notes",
      render: () => <Notes version={version} selection={selection} />,
    },
  ];
}

function getInitialVersion(): string {
  const loc = deserializeLocation(window.location.hash);
  if (loc) {
    return loc.version;
  }

  return getLatestVersion(grayPaperMetadata);
}
