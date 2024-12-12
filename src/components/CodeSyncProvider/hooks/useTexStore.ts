import { TexStore } from "@fluffylabs/synctex-store";
import { useContext, useMemo, useRef } from "react";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";

export function useTexStore() {
  const cacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return useMemo(() => new TexStore(urlGetters.texDirectory, cacheRef.current), [urlGetters]);
}
