import { Header as FluffyHeader } from "@fluffylabs/shared-ui";
import type React from "react";
import { LabelsFilterNew } from "../LabelsFilterNew";
import { Version } from "../Version";
import toolLogoUrl from "./../../assets/tool-logo.svg";

export const Header: React.FC = () => {
  return (
    <FluffyHeader
      toolNameSrc={toolLogoUrl}
      ghRepoName="graypaper-reader"
      endSlot={
        <div className="flex pl-4">
          <LabelsFilterNew />
          <Version />
        </div>
      }
    />
  );
};
