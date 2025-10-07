import { Button, Dialog, DialogModal } from "@fluffylabs/shared-ui";
import { useContext } from "react";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { RemoteSources } from "../../RemoteSources/RemoteSources";

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { remoteSources, handleSetRemoteSources } = useContext(NotesContext) as INotesContext;

  return (
    <DialogModal open={isOpen}>
      <DialogModal.Content className="max-w-2xl">
        <Dialog.Header>Settings</Dialog.Header>
        <Dialog.Content>
          <RemoteSources remoteSources={remoteSources} onChange={handleSetRemoteSources} />
        </Dialog.Content>
        <Dialog.Footer className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </Dialog.Footer>
      </DialogModal.Content>
    </DialogModal>
  );
};
