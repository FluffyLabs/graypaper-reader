import "./Selection.css";
import { type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ISelectionContext, SelectionContext } from "../SelectionProvider/SelectionProvider";

export function Selection() {
  const { selectedBlocks, selectionString, pageNumber } = useContext(SelectionContext) as ISelectionContext;
  const { getSectionTitleAtSynctexBlock, getSubsectionTitleAtSynctexBlock } = useContext(
    CodeSyncContext,
  ) as ICodeSyncContext;
  const [linkCreated, setLinkCreated] = useState(false);
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

  return (
    <div className="selection shrink-0">
      <blockquote>{selectionString}</blockquote>
      <small>
        {selectedBlocks.length ? (
          <span>
            p. {pageNumber} &gt; {sectionTitle === null ? "[no section]" : sectionTitle}{" "}
            {subsectionTitle ? `> ${subsectionTitle}` : null}
          </span>
        ) : (
          <>&nbsp;</>
        )}
      </small>
      <div className="actions">
        <Button
          onClick={createLink}
          tooltip="Create a shareable link to the selected content."
          disabled={selectedBlocks.length === 0}
        >
          {linkCreated ? <span>Copied</span> : "Link"}
        </Button>
        <Tooltip id="selection-tooltip" />
      </div>
    </div>
  );
}

const Button = ({
  onClick,
  tooltip,
  children,
  disabled = false,
}: {
  onClick: () => void;
  tooltip: string;
  children: ReactNode;
  disabled?: boolean;
}) => {
  return (
    <button
      data-tooltip-id="selection-tooltip"
      data-tooltip-content={tooltip}
      data-tooltip-place="bottom"
      disabled={disabled}
      onClick={onClick}
      className="default-button"
    >
      {children}
    </button>
  );
};
