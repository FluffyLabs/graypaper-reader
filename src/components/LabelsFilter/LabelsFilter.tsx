import "./LabelsFilter.css";
import { type MouseEventHandler, useCallback, useMemo, useState } from "react";
import { Label } from "../Label/Label";
import type { ILabelTreeNode } from "../NotesProvider/hooks/useLabels";

export type LabelsFilterProps = {
  labels: ILabelTreeNode[];
  onToggleLabel: (label: ILabelTreeNode) => void;
};

export function LabelsFilter({ labels, onToggleLabel }: LabelsFilterProps) {
  const treeRoots = useMemo(() => {
    // start off with all of the labels and remove all the children
    const roots = new Map(labels.map((x) => [x.prefixedLabel, x]));
    for (const label of labels) {
      for (const child of label.children) {
        roots.delete(child.prefixedLabel);
      }
    }
    return Array.from(roots.values());
  }, [labels]);

  return (
    <div className="labels filter">
      {treeRoots.map((label) => (
        <LabelsFilterNode
          key={label.prefixedLabel}
          label={label}
          onToggleLabel={onToggleLabel}
        />
      ))}
    </div>
  );
}

function LabelsFilterNode({ label, onToggleLabel }: LabelNodeProps) {
  const [isFolded, setFolded] = useState(!label.isActive);
  const toggle = useCallback(() => setFolded((folded) => !folded), []);

  return (
    <>
      {label.children.length > 0 ? (
        <a className="tree-fold default-link" onClick={toggle}>
          {isFolded ? "▷" : "▽"}
        </a>
      ) : null}
      <LabelNode label={label} onToggleLabel={onToggleLabel} />
      <br />
      <div className={`tree-children ${isFolded ? "hide" : "show"}`}>
        {label.children.map((label) => (
          <LabelsFilterNode
            key={label.prefixedLabel}
            label={label}
            onToggleLabel={onToggleLabel}
          />
        ))}
      </div>
    </>
  );
}

type LabelNodeProps = {
  label: ILabelTreeNode;
  onToggleLabel: LabelsFilterProps["onToggleLabel"];
};

function LabelNode({ label, onToggleLabel }: LabelNodeProps) {
  const selectLabel = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      onToggleLabel(label);
    },
    [label, onToggleLabel],
  );

  const clazz = `label-link ${label.isActive ? "active" : ""}`;
  const icon = label.isActive ? "⊙" : "∅";
  return (
    <a className={`${clazz} default-button`} onClick={selectLabel}>
      <Label label={label.prefixedLabel} icon={icon} />
    </a>
  );
}
