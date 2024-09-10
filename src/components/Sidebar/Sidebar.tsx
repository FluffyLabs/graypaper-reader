import "./Sidebar.css";

import { useContext, useEffect, useState } from "react";
import { NoteManager } from "../NoteManager/NoteManager";
// import { Notes } from "../Notes/Notes";
import { Outline } from "../Outline/Outline";
import type { IPdfContext } from "../PdfProvider/PdfProvider";
import { PdfContext } from "../PdfProvider/PdfProvider";
// import { Selection } from "../Selection/Selection";
import { Tabs } from "../Tabs/Tabs";
import { Version } from "../Version/Version";

type SidebarProps = {
  zoom: number;
};

export function Sidebar({ zoom }: SidebarProps) {
  const [tab, setTab] = useState(loadActiveTab());

  // store seletected tab in LS
  useEffect(() => {
    storeActiveTab(tab);
  }, [tab]);

  const tabs = [
    {
      name: "outline",
      render: () => <Outline />,
    },
    {
      name: "notes",
      render: () => <NoteManager />,
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
        <Version />
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
