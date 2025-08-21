import "./Sidebar.css";

import { useCallback, useEffect, useState } from "react";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";
import { NoteManager } from "../NoteManager/NoteManager";
import { Outline } from "../Outline/Outline";
import { Search } from "../Search/Search";
import { Selection } from "../Selection/Selection";
import { Tabs } from "../Tabs/Tabs";

export function Sidebar() {
  const [tab, setTab] = useState(loadActiveTab());

  // store seletected tab in LS
  useEffect(() => {
    storeActiveTab(tab);
  }, [tab]);

  useKeyboardShortcut({
    key: "s",
    onKeyPress: () => setTab("search"),
  });

  // if we have both search & section, we need to wait
  // for the search to be done, before scrolling to section.
  const [searchIsDone, setSearchIsDone] = useState(false);
  const onSearchFinished = useCallback((hasQuery: boolean) => {
    setSearchIsDone(true);
    if (hasQuery) {
      setTab("search");
    }
  }, []);

  const tabs = [
    {
      name: "outline",
      render: () => <Outline searchIsDone={searchIsDone} />,
    },
    {
      name: "notes",
      render: () => <NoteManager />,
    },
    {
      name: "search",
      shortNameFallback: "🔍",
      render: () => <Search tabName="search" onSearchFinished={onSearchFinished} />,
    },
  ];

  return (
    <div className="sidebar bg-sidebar">
      <div className="content">
        <Selection activeTab={tab} switchTab={setTab} />
        <Tabs tabs={tabs} activeTab={tab} switchTab={setTab} alwaysRender />
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
