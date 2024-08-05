import "./Selection.css";
import { InDocLocation, InDocSelection, Section } from "../../utils/IframeController";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { serializeLocation } from "../../utils/location";
import { Tooltip } from "react-tooltip";

type SelectionProps = {
  version: string;
  location: InDocLocation;
  selection: InDocSelection | null;
  activeTab: string;
  switchTab: (tab: "notes") => void;
};

const useIsMount = () => {
  const isMountRef = useRef(true);
  useEffect(() => {
    isMountRef.current = false;
  }, []);
  return isMountRef.current;
};

export function Selection({ version, location, selection, activeTab, switchTab }: SelectionProps) {
  const [linkCreated, setLinkCreated] = useState(false);
  const [selectionCopied, setSelectionCopied] = useState(false);
  const isMount = useIsMount();

  // update hash with every selection
  useEffect(() => {
    if (isMount) {
      return;
    }

    const loc = selection ? "#" + serializeLocation(version, selection) : "";
    window.history.replaceState(null, "", document.location.pathname + loc);
  }, [selection, version, isMount]);

  const createLink = useCallback(() => {
    if (!selection) {
      return;
    }

    window.navigator.clipboard.writeText(window.location.toString());
    setLinkCreated(true);
    window.setTimeout(() => setLinkCreated(false), 2000);
  }, [selection]);

  const openGpt = useCallback(() => {
    const text = selection?.selection.textContent;

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
  }, [selection]);

  const openNotes = useCallback(() => {
    switchTab("notes");
  }, [switchTab]);

  // location is either the constant location from the selection or dynamic location.
  const loc = selection ? selection.location : location;

  const Button = ({ onClick, tooltip, children }: { onClick: () => void; tooltip: string; children: ReactNode }) => {
    return (
      <button
        data-tooltip-id="selection-tooltip"
        data-tooltip-content={tooltip}
        data-tooltip-place="bottom"
        disabled={!selection}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="selection">
      <blockquote>
        {selection ? Array.from(selection.selection.children).map((x) => x.textContent) : "[no text selected]"}
      </blockquote>
      <small>
        <span>
          p:{Number(`0x${loc.page}`)} &gt; {displaySection(loc.section)} &gt; {displaySection(loc.subSection)}
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
        <Tooltip id="selection-tooltip"></Tooltip>
      </div>
    </div>
  );
}

function displaySection(section?: Section) {
  if (!section) {
    return "??";
  }

  return `${section.number} ${section.title}`;
}
