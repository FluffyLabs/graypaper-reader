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
};
export function Tabs({ tabs, activeTab, switchTab }: TabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  const actions = tabs.map((t) => (
    <button key={t.name} disabled={t.name === activeTab} onClick={() => switchTab(t.name)}>
      {t.name}
    </button>
  ));

  const activeTabIdx = tabs.map((t) => t.name).indexOf(activeTab);
  return (
    <div className="tabs">
      <div className="content">{tabs[activeTabIdx].render()}</div>
      <div className="menu">{actions}</div>
    </div>
  );
}
