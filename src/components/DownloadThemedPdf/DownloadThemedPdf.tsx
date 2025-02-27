import { useContext, useState } from "react";
import { Tooltip } from "react-tooltip";
import { type IPdfContext, PdfContext } from "../PdfProvider/PdfProvider";

export function DownloadPdfWithTheme() {
  const { downloadPdfWithTheme } = useContext(PdfContext) as IPdfContext;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadClick = async () => {
    setIsProcessing(true);
    try {
      await downloadPdfWithTheme();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <button
        data-tooltip-id="download"
        data-tooltip-content={isProcessing ? "Processing..." : "Download PDF with current theme"}
        data-tooltip-place="right"
        onClick={handleDownloadClick}
        className={"download-pdf-with-theme"}
        disabled={isProcessing}
      >
        {isProcessing ? "⏳" : "⬇️"}
      </button>
      <Tooltip id="download" />
    </div>
  );
}
