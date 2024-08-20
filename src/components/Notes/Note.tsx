import { type ChangeEvent, useCallback, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";
import type { InDocSelection } from "../../utils/IframeController";
import { deserializeLocation, reserializeLocation, serializeLocation, updateLocation } from "../../utils/location";

export type NotesItem = {
  location: string; // serialized InDocSelection
  content: string;
};

type NoteProps = {
  selection: InDocSelection | null;
  version: string;
  note: NotesItem;
  onEditNote: (n: NotesItem) => void;
  onRemoveNote: (n: NotesItem) => void;
};

export function Note({ selection, note, onEditNote, onRemoveNote, version }: NoteProps) {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      // defer change to prevent onBlur happening before clicks.
      setTimeout(() => {
        setIsEditing(false);
      }, 300);
    } else {
      setIsEditing(true);
    }
  }, [isEditing]);

  const editNote = useCallback(
    (ev: ChangeEvent<HTMLTextAreaElement>) => {
      note.content = ev.currentTarget.value;
      onEditNote(note);
    },
    [note, onEditNote],
  );

  const removeNote = useCallback(() => {
    onRemoveNote(note);
  }, [note, onRemoveNote]);

  const updateLocation = useCallback(
    (href: string) => {
      note.location = href;
      onEditNote(note);
    },
    [note, onEditNote],
  );

  return (
    <li>
      <NoteLink selection={selection} note={note} version={version} onMigrate={updateLocation} />
      {isEditing ? (
        <textarea onChange={editNote} value={note.content} onBlur={toggleEdit} autoFocus />
      ) : (
        <blockquote onClick={toggleEdit} onKeyPress={toggleEdit}>
          {note.content}
        </blockquote>
      )}
      <button className="remove" style={{ display: isEditing ? "block" : "none" }} onClick={removeNote}>
        delete
      </button>
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
