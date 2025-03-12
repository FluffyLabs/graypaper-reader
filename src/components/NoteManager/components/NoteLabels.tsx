import { type ChangeEventHandler, useCallback, useState } from "react";
import { LabelString } from "../../Label/Label";
import { getEditableLabels } from "../../NotesProvider/hooks/useLabels";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";

type NoteLabelsProps = {
  note: IDecoratedNote;
};

export function NoteLabels({ note }: { note: IDecoratedNote }) {
  return (
    <div className="labels">
      {note.original.labels.map((label) => (
        <LabelString key={label} label={label} source={note.source} />
      ))}
    </div>
  );
}

type NoteLabelsEditProps = NoteLabelsProps & {
  onNewLabels: (labels: string[]) => void;
};

const SEPARATOR = ",";
const JOINER = ", ";

export function NoteLabelsEdit({ note, onNewLabels }: NoteLabelsEditProps) {
  const labels = getEditableLabels(note.original.labels).join(JOINER);
  const [currentInput, setCurrentInput] = useState(labels);

  const updateLabels = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      const labels = e.target.value;
      setCurrentInput(labels);
      const newLabels = labels.split(SEPARATOR).map((l) => l.trim());
      onNewLabels(newLabels);
    },
    [onNewLabels],
  );

  return (
    <input
      className="labels-edit"
      onChange={updateLabels}
      placeholder="comma (,) - separated labels"
      type="text"
      value={currentInput}
    />
  );
}
