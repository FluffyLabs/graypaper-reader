import { type ChangeEvent, createContext, useContext } from "react";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";

export const noteContext = createContext<{
  note: IDecoratedNote;
  isEditable: boolean;
  handleEditClick: () => void;
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  handleNoteContentChange: (ev: ChangeEvent<HTMLTextAreaElement>) => void;
  noteDirty: { content: string };
  onEditNote: INotesContext["handleUpdateNote"];
  isEditing: boolean;
} | null>(null);

export const useNoteContext = () => {
  const context = useContext(noteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within a NoteContextProvider");
  }
  return context;
};
