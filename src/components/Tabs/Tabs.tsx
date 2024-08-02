import "./Tabs.css";
import {ReactNode, useState} from "react";

export type Tab = {
  name: string,
  render: () => ReactNode,
};

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  if (tabs.length === 0) {
    return null;
  }

  const actions = tabs.map((t, idx) => (
    <button key={t.name} disabled={idx === activeTabIdx} onClick={() => setActiveTabIdx(idx)}>
      {t.name}
    </button>
  ));

  return (
    <div className="tabs">
      <div className="content">
        {tabs[activeTabIdx].render()}
      </div>
      <div className="menu">
        {actions}
      </div>
    </div>
  );
}

