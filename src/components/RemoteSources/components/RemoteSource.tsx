import { Button } from "@fluffylabs/shared-ui";
import "./RemoteSource.css";
import { useCallback, useState } from "react";
import { NEW_REMOTE_SOURCE_ID } from "../../NotesProvider/consts/remoteSources";
import type { IRemoteSource } from "../../NotesProvider/types/RemoteSource";
import { Versions } from "./Versions";

type RemoteSourceProps = {
  source?: IRemoteSource;
  onChange: (x: IRemoteSource, remove?: true) => void;
};

export function RemoteSource({ source, onChange }: RemoteSourceProps) {
  const [isEditing, setEditing] = useState(source === undefined);
  const [name, setName] = useState(source?.name ?? "");
  const [url, setUrl] = useState(source?.url ?? "");
  const [versions, setVersions] = useState(source?.versions ?? null);

  const isEnabled = source?.isEnabled ?? true;
  const id = source?.id ?? NEW_REMOTE_SOURCE_ID;
  const isFilled = name !== "" && url.startsWith("https://");

  const handleEdit = useCallback(() => {
    if (!isFilled) {
      return;
    }

    setEditing(false);
    onChange({ id, name, url, isEnabled, versions });
  }, [isFilled, id, name, isEnabled, url, versions, onChange]);

  const handleRemove = useCallback(() => {
    if (!source) {
      console.error("Removing a non-existing remote source.");
      return;
    }
    if (!confirm("Are you sure you want to remove the remote source?")) {
      return;
    }
    onChange(source, true);
  }, [source, onChange]);

  const toggleEnabled = useCallback(() => {
    if (!source) {
      console.error("Toggling a non-existing remote source.");
      return;
    }
    onChange({ ...source, isEnabled: !isEnabled });
  }, [onChange, source, isEnabled]);

  if (isEditing) {
    return (
      <div className="remote-source">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Source Name" />
        <br />
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Source URL" />
        <br />
        <Versions isEditing={isEditing} versions={versions} onChange={setVersions} />
        <br />
        <Button variant="outline" disabled={!isFilled} onClick={handleEdit}>
          ok
        </Button>
        {id > NEW_REMOTE_SOURCE_ID ? (
          <Button variant="outline" onClick={handleRemove}>
            remove
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="remote-source">
      <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={isEnabled} onChange={toggleEnabled} />
        <strong>{name}</strong>
      </label>
      {id > 0 ? (
        <a className="default-link" onClick={() => setEditing(true)}>
          &nbsp;✏︎
        </a>
      ) : null}
      <br />
      URL:{" "}
      <em>
        {url}{" "}
        <a className="default-link" href={url} target="_blank" rel="noreferrer noopener">
          &nbsp;🔗
        </a>
      </em>
      <br />
      <Versions versions={versions} />
    </div>
  );
}
