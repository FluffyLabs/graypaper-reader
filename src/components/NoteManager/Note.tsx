import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import type { InDocSelection } from "../../utils/IframeController";
import { deserializeLocation, reserializeLocation, serializeLocation, updateLocation } from "../../utils/location";
import { INotesContext, TAnyNote } from "../NotesProvider/NotesProvider";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  version: string;
  note: TAnyNote;
  onEditNote: INotesContext["handleUpdateNote"];
  onDeleteNote: INotesContext["handleDeleteNote"];
};

export function Note({ note, onEditNote, onDeleteNote, version }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDirty, setNoteDirty] = useState({ ...note });

  useEffect(() => {
    setNoteDirty({ ...note });
  }, [note]);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      // defer change to prevent onBlur happening before clicks.
      setTimeout(() => {
        onEditNote(note, noteDirty);
        setIsEditing(false);
      }, 300);
    } else {
      setIsEditing(true);
    }
  }, [onEditNote, note, noteDirty, isEditing]);

  const handleNoteContentChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteDirty({ ...noteDirty, content: ev.currentTarget.value });
  };

  const handleDeleteClick = useCallback(() => {
    onDeleteNote(note);
  }, [note, onDeleteNote]);

  return (
    <li>
      {/* <NoteLink selection={selection} note={note} version={version} onMigrate={updateLocation} /> */}
      {note.pageNumber}
      {isEditing ? (
        <textarea onChange={handleNoteContentChange} value={noteDirty.content} onBlur={toggleEdit} autoFocus />
      ) : (
        <blockquote onClick={toggleEdit} onKeyPress={toggleEdit}>
          {note.content}
        </blockquote>
      )}
      {isEditing ? (
        <button className="remove" onClick={handleDeleteClick}>
          delete
        </button>
      ) : null}
    </li>
  );
}

type NoteLinkProps = {
  selection: InDocSelection | null;
  note: NotesItem;
  version: string;
  onMigrate: (location: string) => void;
};
function NoteLink({ selection, note, version, onMigrate }: NoteLinkProps) {
  const origLocDetails = useMemo(() => {
    return deserializeLocation(note.location);
  }, [note]);

  const locDetails = useMemo(() => {
    const origVersion = origLocDetails?.shortVersion;
    if (origVersion) {
      if (!version.startsWith(origVersion)) {
        return updateLocation(origLocDetails, version);
      }
    }
    return origLocDetails;
  }, [origLocDetails, version]);

  const newHref = useMemo(() => {
    if (locDetails && origLocDetails !== locDetails) {
      return reserializeLocation(locDetails);
    }
    return note.location;
  }, [origLocDetails, locDetails, note]);

  const migrateNote = useCallback(() => {
    if (selection === null) {
      return;
    }
    const selectionHref = serializeLocation(version, selection);
    if (selectionHref === newHref) {
      onMigrate(newHref);
      return;
    }

    if (confirm("The highlighted part of the document has changed. Update to current selection?")) {
      onMigrate(selectionHref);
    }
  }, [version, selection, newHref, onMigrate]);

  return (
    <div>
      {locDetails !== origLocDetails && (
        <a
          href={`#${note.location}`}
          data-tooltip-id="note-link"
          data-tooltip-content="This note was created in a different version. Click to open the original selection."
          data-tooltip-place="top"
          className="icon"
        >
          ⚠
        </a>
      )}
      <a href={`#${newHref}`}>
        {locDetails ? (
          <span>
            p:{Number(`0x${locDetails?.page}`)} &gt; {locDetails.section} &gt; {locDetails.subSection}
          </span>
        ) : (
          "link"
        )}
      </a>
      {locDetails !== origLocDetails && (
        <a
          onClick={migrateNote}
          data-tooltip-id="note-link"
          data-tooltip-content="Make sure the selection is accurate or adjust it in the current version and update the note."
          data-tooltip-place="top"
          className={selection === null ? "disabled update" : "update"}
        >
          (migrate)
        </a>
      )}
      <Tooltip id="note-link" />
    </div>
  );
}
