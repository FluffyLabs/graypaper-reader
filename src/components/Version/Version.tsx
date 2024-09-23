import { Tooltip } from "react-tooltip";
import "./Version.css";
import { useCallback } from "react";
import { updateLocationVersion } from "../../utils/location";
import { type Metadata, type VersionInfo, getLatestVersion } from "../../utils/metadata";

type VersionProps = {
  metadata: Metadata;
  onChange: (v: string) => void;
  selectedVersion: string;
};

export function Version({ metadata, selectedVersion, onChange }: VersionProps) {
  const versions = Object.keys(metadata.versions);
  const currentVersionHash = metadata.versions[selectedVersion].hash;

  const handleChange = useCallback(
    (v: string) => {
      const newHash = updateLocationVersion(v, window.location.hash);
      // we only call the explicit set version if we don't have the
      // hash already
      if (newHash) {
        window.location.hash = newHash;
      } else {
        onChange(v);
      }
    },
    [onChange],
  );

  return (
    <div className="version">
      {currentVersionHash !== getLatestVersion(metadata) && (
        <span
          data-tooltip-id="version"
          data-tooltip-content="The current version is not the latest."
          data-tooltip-place="top"
          className="icon"
        >
          ⚠
        </span>
      )}
      <select onChange={(ev) => handleChange(ev.target.value)} value={selectedVersion}>
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

type OptionProps = { id: string; version: VersionInfo; latest: string };
function Option({ id, version, latest }: OptionProps) {
  const date = new Date(version.date);
  let latestText = "Latest";
  let versionText = "";
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
