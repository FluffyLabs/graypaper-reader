import { Header as FluffyHeader, useBreakpoint } from "@fluffylabs/shared-ui";
import type React from "react";
import { Version } from "../Version";
import toolLogoUrl from "./../../assets/tool-logo.svg";
import { NotesButtonsGroup } from "./components";

export const Header: React.FC = () => {
  const isLargeOrWider = useBreakpoint("(width > 64rem)");
  const isCustomMediumOrWider = useBreakpoint("(width > 52rem)");

  return (
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
  );
};
