import { Tooltip } from "react-tooltip";
import { useCallback, useContext, useRef } from "react";
import { CodeSyncContext, type ICodeSyncContext } from "../CodeSyncProvider/CodeSyncProvider";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { type IMetadataContext, type IVersionInfo, MetadataContext } from "../MetadataProvider/MetadataProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioItem, DropdownMenuTrigger, DropdownMenuRadioGroup} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";

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
          currentItemRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      });
    }
  };

  return (
    <div className="flex items-center">
      {currentVersionHash !== metadata.latest && (
        <span
          data-tooltip-id="version"
          data-tooltip-content="The current version is not the latest"
          data-tooltip-place="top"
          className="text-amber-500 text-2xl"
        >
          ⚠
        </span>
      )}
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="outlineForcedDark" className={`
            flex-1 mx-4 justify-between
            `}>
            <span>{getCurrentVersionLabel()}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent ref={dropdownContentRef} className="dark w-[var(--radix-dropdown-menu-trigger-width)] border-[var(--border)] bg-[var(--card)] max-h-[60vh] overflow-y-auto">
          <DropdownMenuRadioGroup value={currentVersionHash} onValueChange={handleVersionSelect}>
          {versions.map((version) => (
            <DropdownMenuRadioItem
              value={version.hash}
              key={version.hash}
              ref={version.hash === currentVersionHash ? currentItemRef : null}
              className={twMerge(`
                transition-none
                text-[var(--title-foreground)] hover:bg-[var(--brand)] hover:opacity-65 hover:text-[var(--card)] rounded-sm
                focus:bg-[var(--brand)] focus:opacity-65 focus:text-[var(--card)]
                `,version.hash === currentVersionHash && "bg-[var(--brand)] text-[var(--card)] hover:opacity-100 focus:opacity-100")
              }
            >
              <VersionOption version={version} latest={metadata.latest} />
            </DropdownMenuRadioItem>
          ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip id="version" style={{backgroundColor: 'oklch(76.9% 0.188 70.08)', zIndex: 1, color: 'black', fontSize: '10px'}}/>
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
