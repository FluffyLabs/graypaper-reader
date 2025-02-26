import { useContext } from "react";
import { Tooltip } from "react-tooltip";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";

export function DownloadPdfWithTheme() {
  const { downloadPdfWithTheme } = useContext(PdfContext) as IPdfContext;

  return (
    <div>
      <button
        data-tooltip-id="download"
        data-tooltip-content="Download PDF with the current theme"
        data-tooltip-place="right"
        onClick={downloadPdfWithTheme}
        className={"download-pdf-with-theme"}
      >
        ⬇️
      </button>
      <Tooltip id="download" />
    </div>
  );
}
