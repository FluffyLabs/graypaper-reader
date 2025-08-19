import { Button } from "@fluffylabs/shared-ui";
import { ChevronDown } from "lucide-react";
import { useCallback, useContext, useRef } from "react";
import { Tooltip } from "react-tooltip";
import { twMerge } from "tailwind-merge";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { type IMetadataContext, type IVersionInfo, MetadataContext } from "../MetadataProvider/MetadataProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function Version() {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const { locationParams, setLocationParams } = useContext(LocationContext) as ILocationContext;
  const { migrateSelection } = useContext(CodeSyncContext) as ICodeSyncContext;
  const versions = Object.values(metadata.versions).filter(({ legacy }) => !legacy);
  const currentVersionHash = metadata.versions[locationParams.version].hash;
  const currentVersion = metadata.versions[locationParams.version];
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);

  const handleVersionSelect = useCallback(
    (newVersion: string) => {
      const { selectionStart, selectionEnd, version } = locationParams;
      if (!selectionStart || !selectionEnd) {
        setLocationParams({ version: newVersion });
      } else {
        migrateSelection({ selectionStart, selectionEnd }, version, newVersion).then((newSelection) => {
          setLocationParams({
            ...locationParams,
            selectionStart: newSelection?.selectionStart ?? selectionStart,
            selectionEnd: newSelection?.selectionEnd ?? selectionEnd,
            version: newVersion,
          });
        });
      }
    },
    [setLocationParams, locationParams, migrateSelection],
  );

  const getCurrentVersionLabel = () => {
    const date = new Date(currentVersion.date);
    const isLatest = currentVersion.hash === metadata.latest;
    let label = isLatest ? "Latest" : "v";
    if (currentVersion.name) {
      label += `: ${currentVersion.name}`;
    }
    return `${label} ${shortHash(currentVersion.hash)} (${date.toLocaleDateString()})`;
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      requestAnimationFrame(() => {
        if (currentItemRef.current && dropdownContentRef.current) {
          currentItemRef.current.scrollIntoView({ block: "center", behavior: "instant" });
        }
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-2 mx-4">
      {currentVersionHash !== metadata.latest && (
        <span
          data-tooltip-id="version"
          data-tooltip-content="The current version is not the latest"
          data-tooltip-place="top"
          className="text-amber-500 text-2xl mt-[-2px]"
        >
          ⚠
        </span>
      )}
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" forcedColorScheme="dark" className="flex-1 justify-between h-[32px]">
            <span className="px-2">{getCurrentVersionLabel()}</span>
            <ChevronDown className="ml-2 h-5 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          ref={dropdownContentRef}
          className="dark w-[var(--radix-dropdown-menu-trigger-width)] border-[var(--border)] bg-[var(--card)] max-h-[60vh] overflow-y-auto"
        >
          <DropdownMenuRadioGroup value={currentVersionHash} onValueChange={handleVersionSelect}>
            {versions.map((version) => (
              <DropdownMenuRadioItem
                value={version.hash}
                key={version.hash}
                ref={version.hash === currentVersionHash ? currentItemRef : null}
                className={twMerge(
                  `
                transition-none
                text-[var(--title-foreground)] hover:bg-[var(--brand)] hover:opacity-65 hover:text-[var(--card)] rounded-sm
                focus:bg-[var(--brand)] focus:opacity-65 focus:text-[var(--card)] my-0.5
                `,
                  version.hash === currentVersionHash &&
                    "bg-[var(--brand)] text-[var(--card)] hover:opacity-100 focus:opacity-100",
                )}
              >
                <VersionOption version={version} latest={metadata.latest} />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip
        id="version"
        style={{ backgroundColor: "oklch(76.9% 0.188 70.08)", zIndex: 1, color: "black", fontSize: "10px" }}
      />
    </div>
  );
}

type VersionOptionProps = { version: IVersionInfo; latest: string };
function VersionOption({ version, latest }: VersionOptionProps) {
  const date = new Date(version.date);
  let latestText = "Latest";
  let versionText = "v";
  if (version.name) {
    latestText += `: ${version.name}`;
    versionText += `: ${version.name}`;
  }
  return (
    <span className="w-full">
      {version.hash === latest ? latestText : versionText} {shortHash(version.hash)} ({date.toLocaleDateString()})
    </span>
  );
}

function shortHash(h: string) {
  return `${h.substring(0, 3)}...${h.substring(h.length - 3)}`;
}
