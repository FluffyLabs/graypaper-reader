import React from "react";
import type { ReactNode } from "react";

export type Tab = {
  name: string;
  render: () => ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  switchTab: (v: string) => void;
  /** Always render the components and just change visibility. */
  alwaysRender: boolean;
};

const tabsContext = React.createContext<{ activeTab: string | null }>({
  activeTab: null,
});

export const useTabsContext = () => {
  const context = React.useContext(tabsContext);
  if (!context) {
    throw new Error("useTabsContext must be used within a TabsProvider");
  }
  return context;
};

export function Tabs({ tabs, activeTab, switchTab, alwaysRender }: TabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  const actions = tabs.map((t) => (
    <button className="default-button" key={t.name} disabled={t.name === activeTab} onClick={() => switchTab(t.name)}>
      {t.name}
    </button>
  ));

  const contextValue = React.useMemo(() => ({ activeTab }), [activeTab]);

  const activeTabIdx = tabs.map((t) => t.name).indexOf(activeTab);

  return (
    <tabsContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-0 gap-2">
        <div className="menu">{actions}</div>
        {tabs.map((tab, idx) => {
          if (!alwaysRender && idx !== activeTabIdx) {
            return null;
          }
          return (
            <React.Fragment key={tab.name}>
              <div className={idx === activeTabIdx ? "min-h-0 flex items-stretch py-2" : "hidden"}>{tab.render()}</div>
            </React.Fragment>
          );
        })}
      </div>
    </tabsContext.Provider>
  );
}
