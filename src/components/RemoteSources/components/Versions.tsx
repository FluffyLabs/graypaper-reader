import { useContext, useMemo } from "react";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";

type VersionsProps = {
  versions: string[] | null;
  isEditing?: boolean;
  onChange?: (x: string[] | null) => void;
};

export function Versions({ isEditing = false, versions, onChange }: VersionsProps) {
  const { metadata } = useContext(MetadataContext) as IMetadataContext;

  const versionsMeta = metadata.versions;
  const isAllVersions = versions === null;

  const names = useMemo(() => {
    return versions === null ? [] : versions.map((v) => versionsMeta[v].name ?? v);
  }, [versions, versionsMeta]);

  const allVersions = useMemo(() => {
    return Object.values(versionsMeta).filter((x) => x.name !== undefined);
  }, [versionsMeta]);

  if (isEditing) {
    const allVersionsOption = (
      <label>
        <input type="checkbox" checked={isAllVersions} onChange={() => onChange?.(isAllVersions ? [] : null)} /> all
        versions
      </label>
    );

    if (isAllVersions) {
      return allVersionsOption;
    }

    return (
      <>
        {allVersionsOption}
        {allVersions.map((v) => (
          <label key={v.hash}>
            <input
              type="checkbox"
              checked={names.includes(v.name || "")}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange?.([...versions, v.hash]);
                } else {
                  onChange?.(versions.filter((x) => x !== v.hash));
                }
              }}
            />
            {v.name}
          </label>
        ))}
      </>
    );
  }

  return <>Available in: {isAllVersions ? "all versions" : `${names.join(", ")}`}</>;
}
