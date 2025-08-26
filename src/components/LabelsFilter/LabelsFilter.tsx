import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@fluffylabs/shared-ui";
import { type FC, Fragment, useCallback, useContext, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Label } from "../Label/Label";
import { NotesContext } from "../NotesProvider/NotesProvider";
import type { ILabelTreeNode } from "../NotesProvider/hooks/useLabels";

export type LabelsFilterProps = {
  labels: ILabelTreeNode[];
  onToggleLabel: (label: ILabelTreeNode) => void;
};

const emptyLabels: ILabelTreeNode[] = [];
const emptyCallback = () => {};

export function LabelsFilter({ forcedColorScheme }: { forcedColorScheme?: "dark" | "light" }) {
  const {
    labels = emptyLabels,
    handleToggleLabel = emptyCallback,
    labelsAreLoaded = false,
  } = useContext(NotesContext) ?? {};

  return (
    <LabelsFilterDumb
      labels={labels}
      labelsAreLoaded={labelsAreLoaded}
      onToggleLabel={handleToggleLabel}
      forcedColorScheme={forcedColorScheme}
    />
  );
}

const LabelsFilterDumb: FC<{
  labels: ILabelTreeNode[];
  labelsAreLoaded: boolean;
  onToggleLabel: (label: ILabelTreeNode) => void;
  forcedColorScheme?: "dark" | "light";
}> = ({ labels, labelsAreLoaded, onToggleLabel, forcedColorScheme }) => {
  const treeRoots = useMemo(() => {
    const roots = new Map(labels.map((x) => [x.prefixedLabel, x]));
    for (const label of labels) {
      for (const child of label.children) {
        roots.delete(child.prefixedLabel);
      }
    }
    return Array.from(roots.values());
  }, [labels]);

  const selectLabel = useCallback(
    (label: ILabelTreeNode) => {
      onToggleLabel(label);
    },
    [onToggleLabel],
  );

  const childrenStats = useMemo(() => {
    const allChildren = labels.flatMap((label) => label.children);

    return {
      active: allChildren.filter((child) => child.isActive).length,
      total: allChildren.length,
    };
  }, [labels]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={twMerge("h-[32px] px-5", !labelsAreLoaded && "pointer-events-none")}
          forcedColorScheme={forcedColorScheme}
        >
          Notes labels{" "}
          <span className="bg-[var(--border)] rounded-sm px-2 h-[18px] ml-4 mt-0.25 min-w-11">
            <span className={twMerge(!labelsAreLoaded && "animate-fade-in")}>
              {!labelsAreLoaded && <TextSkeleton className="w-6 h-4 m-0.5" />}
              {labelsAreLoaded && `${childrenStats.active}/${childrenStats.total}`}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto max-w-72" align="end" forcedColorScheme={forcedColorScheme}>
        {treeRoots.map((label) => (
          <Fragment key={label.prefixedLabel}>
            <DropdownMenuCheckboxItem
              key={label.prefixedLabel}
              checked={label.isActive}
              onCheckedChange={() => selectLabel(label)}
              onSelect={(e) => e.preventDefault()}
              className={twMerge("pl-7")}
            >
              <Label
                label={label.prefixedLabel}
                variant={"outlined"}
                className={!label.isActive ? "opacity-65" : ""}
                showTooltip
              />
            </DropdownMenuCheckboxItem>
            {label.children.map((child) => (
              <DropdownMenuCheckboxItem
                key={`${child.prefixedLabel}-children`}
                checked={child.isActive}
                onCheckedChange={() => selectLabel(child)}
                onSelect={(e) => e.preventDefault()}
                className={twMerge("pl-10")}
              >
                <Label
                  label={child.prefixedLabel}
                  variant={"outlined"}
                  className={!child.isActive ? "opacity-65" : ""}
                  showTooltip
                />
              </DropdownMenuCheckboxItem>
            ))}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TextSkeleton: FC<{ className: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "h-4 w-24 bg-gray-300/85 dark:bg-[var(--brand-light)] dark:opacity-15 rounded-md animate-pulse",
        className,
      )}
    />
  );
};
