import { Header as FluffyHeader } from "@fluffylabs/shared-ui";
import type React from "react";
import { Version } from "../Version";
import toolLogoUrl from "./../../assets/tool-logo.svg";
import { NotesButtonsGroup } from "./components";

export const Header: React.FC = () => {
  return (
    <FluffyHeader
      toolNameSrc={toolLogoUrl}
      ghRepoName="graypaper-reader"
      endSlot={
        <>
          <div className="flex pl-4">
            <NotesButtonsGroup className="max-sm:hidden" />
            <Version />
          </div>
          <FluffyHeader.GithubDropdownMenu className="max-sm:hidden" />
        </>
      }
    />
  );
};
