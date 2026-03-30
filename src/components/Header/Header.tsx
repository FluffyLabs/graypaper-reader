import { Header as FluffyHeader, useBreakpoint } from "@fluffylabs/shared-ui";
import type React from "react";
import { useCallback } from "react";
import toolLogoUrl from "./../../assets/tool-logo.svg";
import { useFocusModeContext } from "../FocusModeProvider/FocusModeProvider";
import { Version } from "../Version";
import { NotesButtonsGroup } from "./components";

export const Header: React.FC = () => {
  const isLargeOrWider = useBreakpoint("(width > 64rem)");
  const isCustomMediumOrWider = useBreakpoint("(width > 52rem)");
  const { toggleFocusMode } = useFocusModeContext();

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target;
      if (target instanceof HTMLImageElement && target.src.includes("tool-logo")) {
        toggleFocusMode();
      }
    },
    [toggleFocusMode],
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: focus mode also toggleable via "f" key
    <div onClick={handleHeaderClick}>
      <FluffyHeader
        toolNameSrc={toolLogoUrl}
        ghRepoName="graypaper-reader"
        endSlot={
          <>
            <div className="rounded-md flex ml-4 z-10 dark bg-[var(--card)]">
              {isCustomMediumOrWider && <NotesButtonsGroup className="max-sm:hidden" />}
              <Version />
            </div>
            {isLargeOrWider && <FluffyHeader.GithubDropdownMenu className="max-sm:hidden" />}
          </>
        }
      />
    </div>
  );
};
