import { type ChangeEvent, createContext, useContext } from "react";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";

export const noteContext = createContext<{
  active: boolean;
  note: IDecoratedNote;
  isEditable: boolean;
  handleSelectNote: (deactivate?: boolean) => void;
  handleEditClick: () => void;
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  handleNoteContentChange: (ev: ChangeEvent<HTMLTextAreaElement>) => void;
  handleNoteLabelsChange: (labels: string[]) => void;
  noteDirty: IStorageNote;
  onEditNote: INotesContext["handleUpdateNote"];
  isEditing: boolean;
} | null>(null);

export const useNoteContext = () => {
  const context = useContext(noteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within a <noteContext.Provider/>");
  }
  return context;
};
