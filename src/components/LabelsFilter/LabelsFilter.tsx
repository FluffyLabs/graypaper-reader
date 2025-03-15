import "./LabelsFilter.css";
import { type MouseEventHandler, useCallback } from "react";
import { Label } from "../Label/Label";
import type { ILabelTreeNode } from "../NotesProvider/hooks/useLabels";

export type LabelsFilterProps = {
  labels: ILabelTreeNode[];
  onToggleLabel: (label: ILabelTreeNode) => void;
};

export function LabelsFilter({ labels, onToggleLabel }: LabelsFilterProps) {
  return (
    <div className="labels filter">
      {labels.map((label) => (
        <LabelNode key={label.prefixedLabel} label={label} onToggleLabel={onToggleLabel} />
      ))}
    </div>
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
    <a href="#" className={clazz} onClick={selectLabel}>
      <Label label={label.prefixedLabel} icon={icon} />
    </a>
  );
}
