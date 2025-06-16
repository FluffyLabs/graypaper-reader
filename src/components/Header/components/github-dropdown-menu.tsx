import type { DropdownMenuItemProps } from "@radix-ui/react-dropdown-menu";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

export const GithubDropdownMenu = ({
  triggerButton,
  fluffyRepoName,
}: {
  triggerButton: ReactNode;
  fluffyRepoName: string;
}) => {
  const fluffyRepoUrl = `https://github.com/FluffyLabs/${fluffyRepoName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent className="w-[315px] bg-[#242424] border-none text-white p-4 rounded-lg shadow-md/50 ">
          <CustomDropdownItem
            onSelect={() => window.open(`${fluffyRepoUrl}/issues/new`, "_blank")}
            textPrimary="Report an issue or suggestion"
            textSecondary="Go to the issue creation page"
          />

          <CustomDropdownItem
            onSelect={() => window.open(`https://github.com/FluffyLabs/${fluffyRepoName}`, "_blank")}
            textPrimary="Star us on Github to show support"
            textSecondary="Visit our Github"
          />

          <CustomDropdownItem
            onSelect={() => window.open(`https://github.com/FluffyLabs/${fluffyRepoName}/fork`, "_blank")}
            textPrimary="Fork & contribute"
            textSecondary="Opens the fork creation page"
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};

const CustomDropdownItem = (props: DropdownMenuItemProps & { textPrimary: string; textSecondary: string }) => {
  return (
    <DropdownMenuItem {...props} className="pl-3 pt-3 cursor-pointer group">
      <div className="flex items-start justify-between flex-1">
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none pb-1">{props.textPrimary}</span>
          <span className="text-xs text-muted-foreground">{props.textSecondary}</span>
        </div>

        <ExternalLink className="dark:text-brand opacity-60" />
      </div>
    </DropdownMenuItem>
  );
};
