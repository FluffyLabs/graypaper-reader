import "./PointNote.css";
import type { IPageOffset, IPointNote } from "../../NoteRenderer";

interface PointNoteProps {
  note: IPointNote;
  pageOffset: IPageOffset;
}

export function PointNote({ note, pageOffset }: PointNoteProps) {
  return (
    <div
      className="point-note"
      style={{
        left: `${pageOffset.left + pageOffset.width * note.left}px`,
        top: `${pageOffset.top + pageOffset.height * note.top}px`,
      }}
    >
      {note.content}
    </div>
  );
}
