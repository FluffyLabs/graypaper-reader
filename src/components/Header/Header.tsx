import { Header as FluffyHeader } from "@fluffylabs/shared-ui";
import type React from "react";
import { LabelsFilter } from "../LabelsFilter";
import { Version } from "../Version";
import toolLogoUrl from "./../../assets/tool-logo.svg";

export const Header: React.FC = () => {
  return (
    <FluffyHeader
      toolNameSrc={toolLogoUrl}
      ghRepoName="graypaper-reader"
      endSlot={
        <div className="flex pl-4">
          <LabelsFilter forcedColorScheme="dark" />
          <Version />
        </div>
      }
    />
  );
};
