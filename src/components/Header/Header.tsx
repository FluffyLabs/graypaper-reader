import { Header as FluffyHeader } from "@fluffylabs/shared-ui";
import type React from "react";
import toolLogoUrl from "./../../assets/tool-logo.svg";

export const Header: React.FC = () => {
  return <FluffyHeader toolNameSrc={toolLogoUrl} ghRepoName="graypaper-reader" keepNameWhenSmall />;
};
