import { type ChangeEvent, useCallback, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import type { INotesContext, TAnyNote } from "../NotesProvider/NotesProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

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
      <NoteLink note={note} version={version} />
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
  note: TAnyNote;
  version: string;
};
function NoteLink({ note, version }: NoteLinkProps) {
  const [sectionTitle, setSectionTitle] = useState<string | null>("");
  const [subsectionTitle, setSubsectionTitle] = useState<string | null>("");
  const { selectedBlocks } = useContext(SelectionContext) as ISelectionContext;
  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;

  const migrationFlag = version !== note.version;

  useEffect(() => {
    if ("blocks" in note) {
      getSectionTitleAtSynctexBlock(note.blocks[0]).then((sectionTitleFromSource) =>
        setSectionTitle(sectionTitleFromSource),
      );
      getSubsectionTitleAtSynctexBlock(note.blocks[0]).then((sectionTitleFromSource) =>
        setSubsectionTitle(sectionTitleFromSource),
      );
    }
  }, [note, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock]);

  const handleMigrateClick = () => {};

  return (
    <div>
      {migrationFlag && (
        <a
          href={"#"}
          data-tooltip-id="note-link"
          data-tooltip-content="This note was created in a different version. Click here to see in original context."
          data-tooltip-place="top"
          className="icon"
        >
          ⚠
        </a>
      )}
      <a href="#">
        p. {note.pageNumber} &gt; {sectionTitle === null ? "[no section]" : sectionTitle}{" "}
        {subsectionTitle ? `> ${subsectionTitle}` : null}
      </a>
      {migrationFlag && (
        <a
          onClick={handleMigrateClick}
          data-tooltip-id="note-link"
          data-tooltip-content="Make sure the selection is accurate or adjust it in the current version and update the note."
          data-tooltip-place="top"
          className={selectedBlocks.length === 0 ? "disabled update" : "update"}
        >
          (migrate)
        </a>
      )}
      <Tooltip id="note-link" />
    </div>
  );
}
