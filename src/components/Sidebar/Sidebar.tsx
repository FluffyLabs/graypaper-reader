import "./Sidebar.css";

import { useEffect, useState } from "react";
import { NoteManager } from "../NoteManager/NoteManager";
import { Outline } from "../Outline/Outline";
import { Selection } from "../Selection/Selection";
import { Tabs } from "../Tabs/Tabs";
import { Version } from "../Version/Version";

export function Sidebar() {
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
      <div className="content">
        <Selection activeTab={tab} switchTab={setTab} />
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
