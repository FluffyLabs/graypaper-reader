import "./Sidebar.css";

import { useContext, useEffect, useState } from "react";
import type { Metadata } from "../../utils/metadata";
// import { Notes } from "../Notes/Notes";
import { Outline } from "../Outline/Outline";
import type { IPdfContext } from "../PdfProvider/PdfProvider";
import { PdfContext } from "../PdfProvider/PdfProvider";
// import { Selection } from "../Selection/Selection";
import { Tabs } from "../Tabs/Tabs";
import { Version } from "../Version/Version";
import { NoteManager } from "../NoteManager/NoteManager";

type SidebarProps = {
  metadata: Metadata;
  onVersionChange: (v: string) => void;
  selectedVersion: string;
  zoom: number;
};

export type TOutline = Awaited<ReturnType<IPdfContext["pdfDocument"]["getOutline"]>>;

export function Sidebar({ metadata, onVersionChange, selectedVersion, zoom }: SidebarProps) {
  // const [location, setLocation] = useState({ page: "0" } as InDocLocation);
  // const [selection, setSelection] = useState(null as InDocSelection | null);
  const [outline, setOutline] = useState<TOutline>([]);
  const [tab, setTab] = useState(loadActiveTab());
  const { pdfDocument } = useContext(PdfContext) as IPdfContext;

  // perform one-time operations.
  useEffect(() => {
    pdfDocument.getOutline().then((outline) => setOutline(outline));
  }, [pdfDocument]);

  // maintain location within document
  // useEffect(() => {
  //   return iframeCtrl.trackMouseLocation((loc, sel) => {
  //     setLocation(loc);
  //     setSelection(sel);
  //   });
  // }, [iframeCtrl]);

  // react to changes in hash location
  // useEffect(() => {
  //   const listener = (ev: HashChangeEvent) => {
  //     const [, shortVersion] = iframeCtrl.goToLocation(`#${ev.newURL.split("#")[1]}`);
  //     const versionToSelect = findVersion(shortVersion, metadata);
  //     if (versionToSelect) {
  //       onVersionChange(versionToSelect);
  //     }
  //   };
  //   // read current hash
  //   const [cleanup, shortVersion] = iframeCtrl.goToLocation(window.location.hash);
  //   const versionToSelect = findVersion(shortVersion, metadata);
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
  // }, [iframeCtrl, onVersionChange, metadata]);

  // store seletected tab in LS
  useEffect(() => {
    storeActiveTab(tab);
  }, [tab]);

  const tabs = [
    {
      name: "outline",
      render: () => <Outline outline={outline} />,
    },
    {
      name: "notes",
      render: () => <NoteManager version={selectedVersion} />,
    },
  ];

  return (
    <div className="sidebar">
      <div className="content no-zoom" style={{ height: `${100 * zoom}%`, width: `${100 * zoom}` }}>
        {/* <Selection
          version={selectedVersion}
          location={location}
          selection={selection}
          activeTab={tab}
          switchTab={setTab}
        /> */}
        <Tabs tabs={tabs} activeTab={tab} switchTab={setTab} />
        <Version onChange={onVersionChange} metadata={metadata} selectedVersion={selectedVersion} />
      </div>
    </div>
  );
}

function storeActiveTab(tab: string) {
  window.localStorage.setItem("gp-tab", tab);
}

function loadActiveTab(): string {
  return window.localStorage.getItem("gp-tab") ?? "outline";
}
