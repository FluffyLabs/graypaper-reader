import { useContext } from "react";
import Modal from "react-modal";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { RemoteSources } from "../../RemoteSources/RemoteSources";

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { remoteSources, handleSetRemoteSources } = useContext(NotesContext) as INotesContext;

  return (
    <Modal style={modalStyles} isOpen={isOpen} onRequestClose={onClose} contentLabel="Settings">
      <button className="default-button float-right" onClick={onClose}>
        ✖︎
      </button>
      <div className="text-2xl font-bold mb-4">Settings</div>

      <RemoteSources remoteSources={remoteSources} onChange={handleSetRemoteSources} />

      <br />
      <button className="default-button settings-close" onClick={onClose}>
        close
      </button>
    </Modal>
  );
};
const modalStyles = {
  content: {
    minWidth: "50vw",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
  overlay: { zIndex: 5 },
};
