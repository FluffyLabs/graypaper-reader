import './Version.css';

export type VersionInfo = {
  hash: string,
  date: string,
};

export type Metadata = {
  latest: string
  versions: {
    [key: string]: VersionInfo,
  }
};

export function getLatestVersion(metadata: Metadata) {
  return metadata.latest ?? 'latest';
}

type VersionProps = {
  metadata: Metadata,
  onChange: (v: string) => void,
  selectedVersion: string,
};

export function Version({ metadata, selectedVersion, onChange }: VersionProps) {
  const versions = Object.keys(metadata.versions);
  const currentVersionHash = metadata.versions[selectedVersion].hash;
  return (
    <div className="version">
      <select onChange={(ev) => onChange(ev.target.value)} value={selectedVersion}>
        {versions.map((v) => (<Option key={v} id={v} version={metadata.versions[v]} />))}
      </select>
      <a target="_blank" href={`https://github.com/gavofyork/graypaper/commit/${currentVersionHash}`}>
        Github
      </a>
    </div>
  );
}

type OptionProps = { id: string, version: VersionInfo };
function Option({ id, version }: OptionProps) {
  const date = new Date(version.date);
  return (
    <option value={id}>
      Version {shortHash(version.hash)} ({date.toLocaleDateString()})
    </option>
  );
}

function shortHash(h: string) {
  return `${h.substring(0, 3)}...${h.substring(h.length-3)}`;
}
