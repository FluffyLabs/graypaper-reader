import { type ChangeEventHandler, useCallback, useContext, useRef } from "react";
import { type INotesContext, NotesContext } from "../../NotesProvider/NotesProvider";

export function useImport() {
  const { handleImport } = useContext(NotesContext) as INotesContext;

  const handleFileSelected = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      if (!e.target?.files?.length) {
        return;
      }
      const fileToImport = e.target.files[0];

      const f = new FileReader();
      f.onload = (e) => {
        const fileContent = e.target?.result?.toString() || "";
        const fileName = fileToImport.name.substring(0, 12);
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

  const fileImportRef = useRef<HTMLInputElement>(null);

  const onImport = useCallback(() => {
    fileImportRef.current?.click();
  }, []);

  return {
    onImport,
    fileImportRef,
    handleFileSelected,
  };
}
