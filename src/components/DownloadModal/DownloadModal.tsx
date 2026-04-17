import { Button, DialogModal } from "@fluffylabs/shared-ui";
import { type MouseEvent, useContext, useState } from "react";
import { Tooltip } from "react-tooltip";
import { DOC_CONFIG } from "../../config/documentConfig";
import { SHORT_COMMIT_HASH_LENGTH } from "../LocationProvider/utils/constants";
import { useVersionContext } from "../LocationProvider/VersionProvider";
import { type IMetadataContext, MetadataContext } from "../MetadataProvider/MetadataProvider";
import { type IPdfContext, type ITheme, PdfContext, themesOrder } from "../PdfProvider/PdfProvider";

export function DownloadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const { version } = useVersionContext();
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;
  const { downloadPdfWithTheme } = useContext(PdfContext) as IPdfContext;
  const [generateTheme, setGenerateTheme] = useState<ITheme>("dark");

  const shortVersion = version.substring(0, SHORT_COMMIT_HASH_LENGTH);

  const handleGeneratePdf = async () => {
    setIsProcessing(true);
    setError(undefined);
    try {
      await downloadPdfWithTheme(
        `${DOC_CONFIG.pdfFilePrefix}-${shortVersion}-${generateTheme}-theme.pdf`,
        generateTheme,
      );
      setIsOpen(false);
    } catch {
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAndSave = async (url: string, filename: string) => {
    setIsProcessing(true);
    setError(undefined);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(blobUrl);
      setIsOpen(false);
    } catch {
      setError(`Failed to download ${filename}. The file may not be available for this version.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkClick = (url: string, filename: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (isProcessing) {
      return;
    }
    fetchAndSave(url, filename);
  };

  const pdfUrl = urlGetters.pdf(version);
  const pdfFilename = `${DOC_CONFIG.pdfFilePrefix}-${shortVersion}.pdf`;
  const mdUrl = urlGetters.md(version);
  const mdFilename = `${DOC_CONFIG.pdfFilePrefix}-${shortVersion}.md`;

  return (
    <div>
      <button
        data-tooltip-id="download"
        data-tooltip-content="Download"
        data-tooltip-place="right"
        onClick={() => {
          setError(undefined);
          setIsOpen(true);
        }}
        className="default-button download-pdf-with-theme"
      >
        ⬇️
      </button>
      <Tooltip id="download" />
      <DialogModal open={isOpen}>
        <DialogModal.Content className="max-w-sm">
          <DialogModal.Title>Download</DialogModal.Title>
          <DialogModal.Body>
            <div className="flex flex-col gap-3">
              <Button variant="secondary" className="w-full" asChild>
                <a
                  href={mdUrl}
                  download={mdFilename}
                  onClick={handleLinkClick(mdUrl, mdFilename)}
                  aria-disabled={isProcessing}
                >
                  📝 Download Markdown
                </a>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <a
                  href={pdfUrl}
                  download={pdfFilename}
                  onClick={handleLinkClick(pdfUrl, pdfFilename)}
                  aria-disabled={isProcessing}
                >
                  ⬇️ Download PDF (dark)
                </a>
              </Button>
              <hr className="border-current opacity-20" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs opacity-60">Theme:</label>
                  <div className="flex gap-1">
                    {themesOrder.map((t) => (
                      <button
                        key={t}
                        onClick={() => setGenerateTheme(t)}
                        className={`text-xs px-2 py-1 rounded border ${
                          generateTheme === t ? "border-current opacity-100" : "border-transparent opacity-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" className="w-full" onClick={handleGeneratePdf} disabled={isProcessing}>
                  {isProcessing ? "⏳ Processing..." : `🎨 Generate PDF (${generateTheme})`}
                </Button>
                <p className="text-xs opacity-60">
                  Re-renders all pages with selected theme. May take a couple of minutes.
                </p>
              </div>
            </div>
          </DialogModal.Body>
          {error && <p className="text-xs text-red-400 px-6 pb-2">{error}</p>}
          <DialogModal.Footer>
            <Button variant="tertiary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogModal.Footer>
        </DialogModal.Content>
      </DialogModal>
    </div>
  );
}
