import { useCallback, useState } from "react";
import type { IRemoteSource } from "../NotesProvider/types/RemoteSource";
import { RemoteSource } from "./components/RemoteSource";

type RemoteSourcesProps = {
  remoteSources: IRemoteSource[];
  onChange: (x: IRemoteSource, remove?: true) => void;
};

export function RemoteSources({ remoteSources, onChange }: RemoteSourcesProps) {
  const [isAddingNew, setAddingNew] = useState(false);

  const handleOnChange = useCallback(
    (x: IRemoteSource) => {
      onChange(x);
      setAddingNew(false);
    },
    [onChange],
  );

  return (
    <>
      <h3>Sources of remote notes</h3>
      {remoteSources.map((x) => (
        <RemoteSource key={x.id} source={x} onChange={onChange} />
      ))}
      <br />
      {isAddingNew ? (
        <RemoteSource onChange={handleOnChange} />
      ) : (
        <button className="default-button" onClick={() => setAddingNew(true)}>
          ➕ new source
        </button>
      )}
      <hr />
      <em>
        Disclaimer: the only source of the truth is the Gray Paper. The notes
        here are shared as-is and are not guaranteed to be correct.
      </em>
      <hr />
    </>
  );
}
