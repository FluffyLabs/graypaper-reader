import { Button, DialogModal } from "@fluffylabs/shared-ui";
import { useContext } from "react";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { RemoteSources } from "../../RemoteSources/RemoteSources";

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { remoteSources, handleSetRemoteSources } = useContext(NotesContext) as INotesContext;

  return (
    <DialogModal open={isOpen}>
      <DialogModal.Content className="max-w-2xl">
        <DialogModal.Title>Settings</DialogModal.Title>
        <DialogModal.Body>
          <RemoteSources remoteSources={remoteSources} onChange={handleSetRemoteSources} />
        </DialogModal.Body>
        <DialogModal.Footer className="flex gap-2">
          <Button variant="tertiary" onClick={onClose}>
            Close
          </Button>
        </DialogModal.Footer>
      </DialogModal.Content>
    </DialogModal>
  );
};
