import "./NotesActions.css";
import { type ChangeEventHandler, useCallback, useContext, useRef, useState } from "react";
import Modal from "react-modal";
import { Tooltip } from "react-tooltip";
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

  const [confirmButtonTimeoutId, setConfirmButtonTimeoutId] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [isModalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmDeleteDisabled = confirmDelete && secondsLeft > 0;

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
        const fileName = fileToImport.name.split("-")[0].substring(0, 12);
        try {
          handleImport(fileContent, fileName);
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

  const resetDeleteState = useCallback(() => {
    setSecondsLeft(3);
    setConfirmDelete(false);
    if (confirmButtonTimeoutId) {
      window.clearTimeout(confirmButtonTimeoutId);
      setConfirmButtonTimeoutId(null);
    }
  }, [confirmButtonTimeoutId]);

  const initiateDeleteCountdown = useCallback(() => {
    setSecondsLeft(3);
    setConfirmDelete(true);
    setConfirmButtonTimeoutId(
      window.setTimeout(() => {
        setSecondsLeft(3);
        setConfirmDelete(false);
      }, 10000),
    );
    const disabledButtonIntervalId = window.setInterval(() => {
      setSecondsLeft((x) => {
        if (x <= 1) {
          window.clearInterval(disabledButtonIntervalId);
          return 0;
        }
        return x - 1;
      });
    }, 1000);
  }, []);

  const deleteNotes = useCallback(() => {
    if (confirmDeleteDisabled) return;

    if (confirmDelete) {
      handleDeleteNotes();
      resetDeleteState();
    } else {
      initiateDeleteCountdown();
    }
  }, [confirmDelete, confirmDeleteDisabled, handleDeleteNotes, resetDeleteState, initiateDeleteCountdown]);

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
        <button
          data-tooltip-id="delete-tooltip"
          data-tooltip-content={confirmDelete ? "Yes, delete" : "Delete all notes"}
          data-tooltip-place="bottom"
          disabled={confirmDeleteDisabled}
          onClick={deleteNotes}
        >
          {confirmDelete ? (secondsLeft > 0 ? `Wait (${secondsLeft})` : "❌") : "🗑️"}
        </button>
        <button onClick={toggleModal}>⚙︎</button>
      </div>
      <Tooltip id="delete-tooltip" />
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
