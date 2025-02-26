import "./LabelsFilter.css";
import { useState } from "react";
import { type ILabel, Label, getFullLabelName } from "../Label/Label";

export type LabelsFilterProps = {
  labels: ILabel[];
  onToggleLabel: (label: ILabel) => void;
};

export function LabelsFilterTree({ labels, onToggleLabel }: LabelsFilterProps) {
  return (
    <div className="label-tree-content">
      {labels.map((label) => (
        <LabelNode key={label.label} label={label} onToggleLabel={onToggleLabel} />
      ))}
    </div>
  );
}

type LabelLinkProps = {
  label: ILabel;
  prefix?: string;
  onToggleLabel: LabelsFilterProps["onToggleLabel"];
};

function LabelNode({ label, onToggleLabel }: LabelLinkProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Object.keys(label.children).length > 0;
  const prefix = hasChildren ? (expanded ? "▼" : "▶") : label.isActive ? "⊙" : "∅";
  const clazz = `label-link ${label.isActive ? "active" : ""}`;

  return (
    <div className="label-node">
      <div
        className="label-node-header"
        onClick={() => onToggleLabel(label)}
        onKeyUp={(e) => e.key === "Enter" && setExpanded(!expanded)}
        tabIndex={0}
        role="button"
      >
        <div className={clazz}>
          <Label key={getFullLabelName(label)} label={label.label} prefix={prefix} />
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="label-node-content">
          {Object.values(label.children).map((child) => (
            <LabelNode key={child.label} label={child} onToggleLabel={onToggleLabel} />
          ))}
        </div>
      )}
    </div>
  );
}
