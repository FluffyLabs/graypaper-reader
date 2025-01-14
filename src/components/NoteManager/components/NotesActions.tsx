import { type ChangeEventHandler, useCallback, useContext, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { LEGACY_READER_HOST } from "../../MetadataProvider/MetadataProvider";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";

export function NotesActions() {
  const { canUndo, canRedo, hasLegacyNotes, handleUndo, handleRedo, handleImport, handleExport, handleLegacyExport } =
    useContext(NotesContext) as INotesContext;

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

  return (
    <>
      <div className="notes-actions">
        <button onClick={handleUndo} disabled={!canUndo}>
          undo
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          redo
        </button>
        <button onClick={onImport}>import notes</button>
        <button onClick={handleExport}>export notes</button>
        {hasLegacyNotes ? (
          <button
            data-tooltip-id="legacy-export-tooltip"
            data-tooltip-content={`Notes from the old version of graypaper reader have been detected. You may export them for use with ${LEGACY_READER_HOST}.`}
            data-tooltip-place="bottom"
            onClick={handleLegacyExport}
          >
            export old notes
          </button>
        ) : null}
      </div>
      <input ref={fileImport} onChange={handleFileSelected} type="file" style={{ display: "none" }} />
      <Tooltip id="legacy-export-tooltip" />
    </>
  );
}
