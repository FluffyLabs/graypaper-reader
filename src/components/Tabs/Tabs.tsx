import { Button } from "@fluffylabs/shared-ui";
import { Slot } from "@radix-ui/react-slot";
import React, { useEffect } from "react";
import type { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type Tab = {
  name: string;
  shortNameFallback?: string;
  render: () => ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  switchTab: (v: string) => void;
  /** Always render the components and just change visibility. */
  alwaysRender: boolean;
  /** When the container width is less than this value, the short name fallback will be used. */
  shortNameFallbackTreshold?: number;
};

const tabsContext = React.createContext<{ activeTab: string | null; shortNameFallbackTreshold: number }>({
  activeTab: null,
  shortNameFallbackTreshold: 0,
});

export const useTabsContext = () => {
  const context = React.useContext(tabsContext);
  if (!context) {
    throw new Error("useTabsContext must be used within a TabsProvider");
  }
  return context;
};

const useContainerWidth = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    let lastRunTime = 0;
    const throttleDelay = 100;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const now = Date.now();

        if (now - lastRunTime >= throttleDelay) {
          setWidth(width);
          lastRunTime = now;
        }
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, width };
};

export function Tabs({ tabs, activeTab, switchTab, alwaysRender, shortNameFallbackTreshold = 220 }: TabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  const contextValue = React.useMemo(
    () => ({ activeTab, shortNameFallbackTreshold }),
    [activeTab, shortNameFallbackTreshold],
  );

  const activeTabIdx = tabs.map((t) => t.name).indexOf(activeTab);

  return (
    <tabsContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-0 py-2 gap-4 pb-4">
        <TabsMenu activeTab={activeTab} switchTab={switchTab} tabs={tabs} />
        {tabs.map((tab, idx) => {
          if (!alwaysRender && idx !== activeTabIdx) {
            return null;
          }
          return (
            <React.Fragment key={tab.name}>
              <div className={idx === activeTabIdx ? "min-h-0 flex" : "hidden"}>
                <Slot className="w-full">{tab.render()}</Slot>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </tabsContext.Provider>
  );
}

export const TabsMenu: FC<{ activeTab: string; switchTab: (name: string) => void; tabs: Tab[] }> = ({
  activeTab,
  switchTab,
  tabs,
}) => {
  const { ref, width } = useContainerWidth();
  const { shortNameFallbackTreshold } = useTabsContext();
  const shouldRenderShortName = width > 0 && width < shortNameFallbackTreshold;

  const actions = tabs.map((t) => (
    <Button
      variant="outlineBrand"
      key={t.name}
      disabled={t.name === activeTab}
      onClick={() => switchTab(t.name)}
      data-testid={`tab-${t.name}`}
      className={twMerge(
        "grow h-8 capitalize",
        "hover:bg-brand-very-light text-[var(--brand-darkest)] dark:text-brand  dark:hover:text-brand hover:text-[var(--secondary-foreground)] dark:hover:bg-brand-darkest",
        "rounded-none first-of-type:rounded-l-md last-of-type:rounded-r-md  border-1 border-l-0 first-of-type:border-l-1",
        t.name === activeTab
          ? "bg-brand-dark dark:bg-brand text-[var(--sidebar)] dark:text-brand-darkest disabled:opacity-100"
          : "bg-transparent",
      )}
    >
      {t.shortNameFallback && shouldRenderShortName ? t.shortNameFallback : t.name}
    </Button>
  ));

  return (
    <div className="flex" ref={ref}>
      {actions}
    </div>
  );
};
