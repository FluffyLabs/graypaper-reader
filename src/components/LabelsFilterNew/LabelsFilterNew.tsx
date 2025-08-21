import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@fluffylabs/shared-ui";
import { type FC, useCallback, useContext, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { Label } from "../Label/Label";
import { NotesContext } from "../NotesProvider/NotesProvider";
import type { ILabelTreeNode } from "../NotesProvider/hooks/useLabels";

export type LabelsFilterNewProps = {
  labels: ILabelTreeNode[];
  onToggleLabel: (label: ILabelTreeNode) => void;
};

const emptyLabels: ILabelTreeNode[] = [];
const emptyCallback = () => {};

export function LabelsFilterNew({ forcedColorScheme }: { forcedColorScheme?: "dark" | "light" }) {
  const { labels = emptyLabels, handleToggleLabel = emptyCallback } = useContext(NotesContext) ?? {};

  return (
    <LabelsFilterNewDumb labels={labels} onToggleLabel={handleToggleLabel} forcedColorScheme={forcedColorScheme} />
  );
}

const LabelsFilterNewDumb: FC<{
  labels: ILabelTreeNode[];
  onToggleLabel: (label: ILabelTreeNode) => void;
  forcedColorScheme?: "dark" | "light";
}> = ({ labels, onToggleLabel, forcedColorScheme }) => {
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

  const allNodesActiveCount = useMemo(() => {
    let count = 0;
    for (const label of labels) {
      for (const child of label.children) {
        if (child.isActive) {
          count++;
        }
      }
    }
    return count;
  }, [labels]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-[32px] px-5" forcedColorScheme={forcedColorScheme}>
          Labels notes{" "}
          <span className="bg-[var(--border)] rounded-sm px-2 h-[18px] ml-4 mt-0.25">{allNodesActiveCount}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto max-w-72" align="end">
        {treeRoots.map((label) => (
          <>
            <DropdownMenuCheckboxItem
              key={label.prefixedLabel}
              checked={label.isActive}
              onCheckedChange={() => selectLabel(label)}
              className={twMerge("pl-7", !label.isActive && "opacity-25")}
            >
              <Label label={label.prefixedLabel} />
            </DropdownMenuCheckboxItem>
            {label.children.map((child) => (
              <DropdownMenuCheckboxItem
                key={`${child.prefixedLabel}-children`}
                checked={child.isActive}
                onCheckedChange={() => selectLabel(child)}
                className={twMerge("pl-10", !child.isActive && "opacity-25")}
              >
                <Label label={child.prefixedLabel} />
              </DropdownMenuCheckboxItem>
            ))}
          </>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
