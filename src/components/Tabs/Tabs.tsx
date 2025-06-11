import React from "react";
import "./Tabs.css";
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

export function Tabs({ tabs, activeTab, switchTab, alwaysRender }: TabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  const actions = tabs.map((t) => (
    <button className="default-button" key={t.name} disabled={t.name === activeTab} onClick={() => switchTab(t.name)}>
      {t.name}
    </button>
  ));

  const activeTabIdx = tabs.map((t) => t.name).indexOf(activeTab);
  if (alwaysRender) {
    return (
      <div className="tabs">
        {tabs.map((tab, idx) => {
          return (
            <React.Fragment key={tab.name}>
              <div className={idx === activeTabIdx ? "content" : "hidden"}>{tab.render()}</div>
            </React.Fragment>
          );
        })}
        <div className="menu">{actions}</div>
      </div>
    );
  }
  return (
    <div className="tabs">
      <div className="content">{tabs[activeTabIdx].render()}</div>
      <div className="menu">{actions}</div>
    </div>
  );
}
