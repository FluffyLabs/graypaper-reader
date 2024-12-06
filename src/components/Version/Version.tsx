import { Tooltip } from "react-tooltip";
import "./Version.css";
import { type ChangeEventHandler, useCallback, useContext } from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { type IMetadataContext, type IVersionInfo, MetadataContext } from "../MetadataProvider/MetadataProvider";

export function Version() {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const {
    locationParams: { version },
    setLocationParams,
  } = useContext(LocationContext) as ILocationContext;
  const versions = Object.values(metadata.versions).filter(({ legacy }) => !legacy);
  const currentVersionHash = metadata.versions[version].hash;

  const handleChange = useCallback<ChangeEventHandler<HTMLSelectElement>>(
    (e) => {
      setLocationParams({ version: e.target.value });
    },
    [setLocationParams],
  );

  return (
    <div className="version">
      {currentVersionHash !== metadata.latest && (
        <span
          data-tooltip-id="version"
          data-tooltip-content="The current version is not the latest."
          data-tooltip-place="top"
          className="icon"
        >
          ⚠
        </span>
      )}
      <select onChange={handleChange} value={version}>
        {versions.map((v) => (
          <Option key={v.hash} id={v.hash} version={v} latest={metadata.latest} />
        ))}
      </select>
      <a
        data-tooltip-id="version"
        data-tooltip-content="Open GrayPaper github commit."
        data-tooltip-place="top"
        target="_blank"
        href={`https://github.com/gavofyork/graypaper/commit/${currentVersionHash}`}
        rel="noreferrer"
      >
        Github
      </a>
      <Tooltip id="version" />
    </div>
  );
}

type OptionProps = { id: string; version: IVersionInfo; latest: string };
function Option({ id, version, latest }: OptionProps) {
  const date = new Date(version.date);
  let latestText = "Latest";
  let versionText = "v";
  if (version.name) {
    latestText += `: ${version.name}`;
    versionText += `: ${version.name}`;
  }
  return (
    <option value={id}>
      {version.hash === latest ? latestText : versionText} {shortHash(version.hash)} ({date.toLocaleDateString()})
    </option>
  );
}

function shortHash(h: string) {
  return `${h.substring(0, 3)}...${h.substring(h.length - 3)}`;
}
