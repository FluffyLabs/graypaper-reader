import "./Sidebar.css";

import { useCallback, useEffect, useState } from "react";
import type {
  IframeController,
  InDocLocation,
  InDocSelection,
  Outline as OutlineType,
} from "../../utils/IframeController";
import { type Metadata, findVersion } from "../../utils/metadata";
import { Notes } from "../Notes/Notes";
import { Outline } from "../Outline/Outline";
import { Selection } from "../Selection/Selection";
import { Tabs } from "../Tabs/Tabs";
import { Version } from "../Version/Version";

type SidebarProps = {
  metadata: Metadata;
  iframeCtrl: IframeController;
  selectedVersion: string;
  onVersionChange: (v: string) => void;
};

export function Sidebar({ iframeCtrl, selectedVersion, onVersionChange, metadata }: SidebarProps) {
  const [location, setLocation] = useState({ page: "0" } as InDocLocation);
  const [selection, setSelection] = useState(null as InDocSelection | null);
  const [outline, setOutline] = useState([] as OutlineType);
  const [tab, setTab] = useState("outline");

  // perform one-time operations.
  useEffect(() => {
    setOutline(iframeCtrl.getOutline());

    iframeCtrl.injectStyles();
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
      const [, shortVersion] = iframeCtrl.goToLocation(`#${ev.newURL.split("#")[1]}`);
      const versionToSelect = findVersion(shortVersion, metadata);
      if (versionToSelect) {
        onVersionChange(versionToSelect);
      }
    };
    // read current hash
    const [cleanup, shortVersion] = iframeCtrl.goToLocation(window.location.hash);
    const versionToSelect = findVersion(shortVersion, metadata);
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
  }, [iframeCtrl, onVersionChange, metadata]);

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
      <Version onChange={onVersionChange} metadata={metadata} selectedVersion={selectedVersion} />
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
