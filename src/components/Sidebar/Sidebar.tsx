import "./Sidebar.css";

import { useBreakpoint } from "@fluffylabs/shared-ui";
import { Columns2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";
import { NoteManager } from "../NoteManager/NoteManager";
import { Outline } from "../Outline/Outline";
import { Search } from "../Search/Search";
import { useSplitScreenContext } from "../SplitScreenProvider/SplitScreenProvider";
import { Tabs } from "../Tabs/Tabs";

const SPLIT_TAB_NAME = "split";

export function Sidebar() {
  const [tab, setTab] = useState(loadActiveTab());

  // store selected tab in LS
  useEffect(() => {
    if (tab !== SPLIT_TAB_NAME) {
      storeActiveTab(tab);
    }
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

  const { activateSplit, isSplitActive } = useSplitScreenContext();
  const isNarrow = useBreakpoint("(max-width: 768px)");
  const showSplitTab = !isNarrow && !isSplitActive;

  const handleSwitchTab = useCallback(
    (newTab: string) => {
      if (newTab === SPLIT_TAB_NAME) {
        activateSplit();
        return;
      }
      setTab(newTab);
    },
    [activateSplit],
  );

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
    // Split tab: only on wide screens when split is not already active
    ...(showSplitTab
      ? [
          {
            name: SPLIT_TAB_NAME,
            icon: <Columns2 className="h-4 w-4" />,
            render: () => null,
          },
        ]
      : []),
  ];

  return (
    <div className="gp-sidebar bg-sidebar">
      <div className="content mt-2">
        <Tabs tabs={tabs} activeTab={tab} switchTab={handleSwitchTab} alwaysRender />
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
