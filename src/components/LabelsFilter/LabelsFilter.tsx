import "./LabelsFilter.css";
import { type MouseEventHandler, useCallback, useMemo } from "react";
import { Label } from "../Label/Label";
import { buildLabelTree, type ILabel } from "../NotesProvider/hooks/useLabels";

export type LabelsFilterProps = {
  labels: ILabel[];
  onToggleLabel: (label: ILabel) => void;
};

export function LabelsFilter({ labels, onToggleLabel }: LabelsFilterProps) {
  const labelsTree = useMemo(() => buildLabelTree(labels), [labels]);
  return (
    <div className="labels filter">
      {labelsTree.map((label) => (
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
      onToggleLabel(label);
    },
    [label, onToggleLabel],
  );

  const clazz = `label-link ${label.isActive ? "active" : ""}`;
  const ico = label.isActive ? "⊙" : "∅";
  return (
    <a href="#" className={clazz} onClick={selectLabel}>
      <Label label={label.label} prefix={ico} />
    </a>
  );
}
