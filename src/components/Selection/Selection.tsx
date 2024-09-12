import "./Selection.css";
import { type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

type SelectionProps = {
  activeTab: string;
  switchTab: (tab: "notes") => void;
};

export function Selection({ activeTab, switchTab }: SelectionProps) {
  const { selectedBlocks, selectionString, pageNumber } = useContext(SelectionContext) as ISelectionContext;
  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;
  const [linkCreated, setLinkCreated] = useState(false);
  const [selectionCopied, setSelectionCopied] = useState(false);
  const [sectionTitle, setSectionTitle] = useState<string | null>("");
  const [subsectionTitle, setSubsectionTitle] = useState<string | null>("");

  useEffect(() => {
    if (!selectedBlocks.length) return;

    getSectionTitleAtSynctexBlock(selectedBlocks[0]).then((sectionTitleFromSource) =>
      setSectionTitle(sectionTitleFromSource),
    );
    getSubsectionTitleAtSynctexBlock(selectedBlocks[0]).then((sectionTitleFromSource) =>
      setSubsectionTitle(sectionTitleFromSource),
    );
  }, [selectedBlocks, getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock]);

  const createLink = useCallback(() => {
    if (!selectedBlocks.length) {
      return;
    }

    window.navigator.clipboard.writeText(window.location.toString());
    setLinkCreated(true);
    window.setTimeout(() => setLinkCreated(false), 2000);
  }, [selectedBlocks]);

  const openGpt = useCallback(() => {
    const text = selectionString;

    const prompt = `
      Please provide a deep explanation based only on the GrayPaper for the following quote:

      ${text}
    `;
    window.navigator.clipboard.writeText(prompt);

    setSelectionCopied(true);
    window.setTimeout(() => setSelectionCopied(false), 2000);

    const a = document.createElement("a");
    a.target = "_blank";
    a.href = "https://chatgpt.com/g/g-ZuDULS0ij-dzemmer";
    a.click();
  }, [selectionString]);

  const openNotes = useCallback(() => {
    switchTab("notes");
  }, [switchTab]);

  const Button = ({ onClick, tooltip, children }: { onClick: () => void; tooltip: string; children: ReactNode }) => {
    return (
      <button
        data-tooltip-id="selection-tooltip"
        data-tooltip-content={tooltip}
        data-tooltip-place="bottom"
        disabled={!selectedBlocks.length}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="selection">
      <blockquote>{selectionString}</blockquote>
      <small>
        <span>
          p. {pageNumber} &gt; {sectionTitle === null ? "[no section]" : sectionTitle}{" "}
          {subsectionTitle ? `> ${subsectionTitle}` : null}
        </span>
      </small>
      <div className="actions">
        <Button onClick={createLink} tooltip="Create a shareable link to the selected content.">
          {linkCreated ? <span>Copied</span> : "Link"}
        </Button>
        <Button
          onClick={openGpt}
          tooltip="Open a GrayPaper-specific ChatGPT and copy the prompt with selection to clipboard."
        >
          {selectionCopied ? <span>Copied</span> : "Explain"}
        </Button>
        {activeTab !== "notes" && (
          <Button onClick={openNotes} tooltip="Create a local note to the selected content.">
            Add note
          </Button>
        )}
        <Tooltip id="selection-tooltip" />
      </div>
    </div>
  );
}
