import { Tooltip } from "react-tooltip";
import "./Version.css";
import { useCallback, useContext } from "react";
import { updateLocationVersion } from "../../utils/location";
import { IMetadataContext, MetadataContext, IVersionInfo } from "../MetadataProvider/MetadataProvider";
import { ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";

export function Version() {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;
  const {
    locationParams: { version },
    setLocationParams,
  } = useContext(LocationContext) as ILocationContext;
  const versions = Object.keys(metadata.versions);
  const currentVersionHash = metadata.versions[version].hash;

  const handleChange = useCallback(
    (version: string) => {
      setLocationParams({ version });
    },
    [setLocationParams]
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
      <select onChange={(ev) => handleChange(ev.target.value)} value={version}>
        {versions.map((v) => (
          <Option key={v} id={v} version={metadata.versions[v]} latest={metadata.latest} />
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
  return (
    <option value={id}>
      {version.hash === latest ? "Latest" : "Version"} {shortHash(version.hash)} ({date.toLocaleDateString()})
    </option>
  );
}

function shortHash(h: string) {
  return `${h.substring(0, 3)}...${h.substring(h.length - 3)}`;
}
