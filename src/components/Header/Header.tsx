import type React from "react";
import fluffyLogo from "./../../assets/fluffy-logo.svg";
import { DropdownButton } from "./components/dropdown-button";
import { GithubDropdownMenu } from "./components/github-dropdown-menu";

export interface HeaderProps {
  toolNameSrc: string;
  fluffyRepoName: string;
  endSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ toolNameSrc, fluffyRepoName, endSlot }) => {
  return (
    <div className="bg-[#242424] w-full flex flex-row items-center justify-between py-[18px] text-xs overflow-hidden border-b border-b-secondary-foreground dark:border-b-brand">
      <div className="flex items-center gap-5 sm:w-full">
        <a href="/" className="flex items-center pl-4">
          <img alt="FluffyLabs logo" className="h-[40px] max-w-fit" src={fluffyLogo} />
        </a>
        <div
          data-orientation="vertical"
          aria-orientation="vertical"
          className="bg-gray-600 w-[1px] h-[40px] sm:h-[50px]"
        />
        <div className="flex max-sm:flex-col-reverse max-sm:hidden items-end md:items-center h-[50px] gap-2">
          <img alt="Tool logo" className="h-[40px]" src={toolNameSrc} />
          <div className="shrink sm:ml-1 sm:mb-4">
            <span
              data-slot="badge"
              className="inline-flex items-center justify-center rounded-md border font-medium w-fit shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent [a&]:hover:bg-primary/90 px-1.5 py-[0.5px] sm:py-1 bg-brand text-[10px] max-sm:text-[7px] text-black whitespace-nowrap hover:bg-brand"
            >
              beta
            </span>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center max-sm:ml-2 justify-between pr-4">
        <div>{endSlot}</div>
        <GithubDropdownMenu fluffyRepoName={fluffyRepoName} triggerButton={<DropdownButton />} />
      </div>
    </div>
  );
};
