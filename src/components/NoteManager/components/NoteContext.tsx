import { createContext, useContext } from "react";
import type { INotesContext } from "../../NotesProvider/NotesProvider";
import type { IDecoratedNote } from "../../NotesProvider/types/DecoratedNote";
import type { IStorageNote } from "../../NotesProvider/types/StorageNote";

export type ISingleNoteContext = {
  active: boolean;
  note: IDecoratedNote;
  isEditable: boolean;
  handleSelectNote: (opts?: { type?: "currentVersion" | "originalVersion" | "close" }) => void;
  handleEditClick: () => void;
  handleSaveClick: () => void;
  handleCancelClick: () => void;
  handleNoteLabelsChange: (labels: string[]) => void;
  noteDirty: IStorageNote;
  onEditNote: INotesContext["handleUpdateNote"];
  isEditing: boolean;
  noteOriginalVersionShort: string | undefined;
  originalVersionLink: string | undefined;
  currentVersionLink: string | undefined;
  sectionTitles: { sectionTitle: string; subSectionTitle: string };
};

export const noteContext = createContext<ISingleNoteContext | null>(null);

export const useNoteContext = () => {
  const context = useContext(noteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within a <noteContext.Provider/>");
  }
  return context;
};
