import "./NotesActions.css";
import { type ChangeEventHandler, useCallback, useContext, useRef, useState } from "react";
import Modal from "react-modal";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";
import { RemoteSources } from "../../RemoteSources/RemoteSources";

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

export function NotesActions() {
  const {
    remoteSources,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleImport,
    handleExport,
    handleDeleteNotes,
    handleSetRemoteSources,
  } = useContext(NotesContext) as INotesContext;

  const [isModalOpen, setModalOpen] = useState(false);

  const fileImport = useRef<HTMLInputElement>(null);
  const onImport = useCallback(() => {
    fileImport.current?.click();
  }, []);

  const handleFileSelected = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (ev) => {
      if (!ev.target?.files?.length) {
        return;
      }
      const fileToImport = ev.target.files[0];

      const f = new FileReader();
      f.onload = (e) => {
        const fileContent = e.target?.result?.toString() || "";
        try {
          handleImport(fileContent, fileToImport.name.substring(0, 12));
        } catch (e) {
          console.error(e);
          alert("Unable to load the notes file. Check console for details.");
        }
      };
      f.readAsText(fileToImport);
    },
    [handleImport],
  );

  const toggleModal = useCallback(() => {
    setModalOpen((x) => !x);
  }, []);

  return (
    <>
      <div className="notes-actions">
        <button onClick={handleUndo} disabled={!canUndo}>
          ↺ undo
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          ↻ redo
        </button>
        <button onClick={onImport}>📂 import</button>
        <button onClick={handleExport}>💾 export</button>
        <button onClick={handleDeleteNotes}>🗑 delete</button>
        <button onClick={toggleModal}>⚙︎</button>
      </div>
      <input ref={fileImport} onChange={handleFileSelected} type="file" style={{ display: "none" }} />
      <Modal style={modalStyles} isOpen={isModalOpen} onRequestClose={toggleModal} contentLabel="Settings">
        <button className="settings-close" onClick={toggleModal}>
          ✖︎
        </button>
        <div className="settings-title">Settings</div>
        <RemoteSources remoteSources={remoteSources} onChange={handleSetRemoteSources} />

        <br />
        <button className="settings-close" onClick={toggleModal}>
          close
        </button>
      </Modal>
    </>
  );
}
