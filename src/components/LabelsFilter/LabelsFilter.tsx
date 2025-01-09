import { type MouseEventHandler, useCallback } from "react";
import type { ILabel } from "../NotesProvider/hooks/useLabels";
import { Label } from "../Label/Label";

export type LabelsFilterProps = {
  labels: ILabel[];
  onToggleLabel: (label: string) => void;
};

export function LabelsFilter({ labels, onToggleLabel }: LabelsFilterProps) {
  return (
    <div className="labels filter">
      {labels.map((label) => (
        <LabelLink key={label.label} label={label} onToggleLabel={onToggleLabel} />
      ))}
    </div>
  );
}

type LabelLinkProps = {
  label: ILabel;
  onToggleLabel: LabelsFilterProps["onToggleLabel"];
};

function LabelLink({ label, onToggleLabel }: LabelLinkProps) {
  const selectLabel = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      onToggleLabel(label.label);
    },
    [label, onToggleLabel],
  );

  const clazz = `label ${label.isActive && "active"}`;
  const ico = label.isActive ? "⊙" : "∅";
  return (
    <a href="#" className={clazz} onClick={selectLabel}>
      <Label label={label.label} prefix={ico} />
    </a>
  );
}
