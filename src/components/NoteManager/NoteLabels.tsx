import { type ChangeEventHandler, useCallback, useState } from "react";
import { type TAnyNote, editableLabels } from "../NotesProvider/NotesProvider";
import { Label } from "./Label";

type NoteLabelsProps = {
  note: TAnyNote;
};

export function NoteLabels({ note }: NoteLabelsProps) {
  return (
    <div className="labels">
      {note.labels.map((label) => (
        <Label key={label} label={label} />
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
  const labels = editableLabels(note.labels).join(JOINER);
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
