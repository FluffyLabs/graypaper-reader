import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@fluffylabs/shared-ui";
import { useCallback, useContext, useState } from "react";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { ConfirmDropdownMenuItem } from "./ConfirmDropdownMenuItem";
import { SettingsModal } from "./SettingsModal";
import { useImport } from "./useImport";

export const MoreButtonNotesActionsButton = () => {
  const { handleExport, handleDeleteNotes } = useContext(NotesContext) as INotesContext;
  const { fileImportRef, handleFileSelected, onImport } = useImport();
  const [isModalOpen, setModalOpen] = useState(false);

  const toggleModal = useCallback(() => {
    setModalOpen((x) => !x);
  }, []);

  return (
    <>
      <input ref={fileImportRef} onChange={handleFileSelected} type="file" className="hidden" />
      <SettingsModal isOpen={isModalOpen} onClose={toggleModal} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="tertiary" forcedColorScheme="dark" className="h-[32px]">
            ...
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto max-w-72 dark" align="end" forcedColorScheme="dark">
          <DropdownMenuItem className="flex gap-4 justify-between" onClick={onImport}>
            <span>Import</span>
            <span>📂</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex gap-4 justify-between" onClick={handleExport}>
            <span>Export</span>
            <span> 💾</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex gap-4 justify-between" onClick={toggleModal}>
            <span>Settings</span>
            <span>⚙️</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ConfirmDropdownMenuItem
            className="flex gap-4 justify-between"
            onClick={handleDeleteNotes}
            confirmChildren={
              <>
                <span>Confirm deletion</span>
                <span>❌</span>
              </>
            }
          >
            <span>Delete all notes</span>
            <span>🗑️</span>
          </ConfirmDropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
