import "./LabelsFilter.css";
import { type MouseEventHandler, useCallback, useMemo } from "react";
import { Label } from "../Label/Label";
import { type ILabel, buildLabelTree } from "../NotesProvider/hooks/useLabels";

export type LabelsFilterProps = {
  labels: ILabel[];
  onToggleLabel: (label: ILabel) => void;
};

export function LabelsFilter({ labels, onToggleLabel }: LabelsFilterProps) {
  const labelsTree = useMemo(() => buildLabelTree(labels), [labels]);
  return (
    <div className="labels filter">
      {labelsTree
        //.filter((label) => label.label.indexOf("/") === -1) // root labels only
        .map((label) => (
          <LabelNode key={label.label} label={label} onToggleLabel={onToggleLabel} />
        ))}
    </div>
  );
}

type LabelNodeProps = {
  label: ILabel;
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
  const ico = label.isActive ? "⊙" : "∅";
  return (
    <a href="#" className={clazz} onClick={selectLabel}>
      <Label label={label} prefix={ico} />
    </a>
  );
}
