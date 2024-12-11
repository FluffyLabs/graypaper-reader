import { useContext, useMemo, useRef } from "react";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";
import { TexStore } from "@fluffylabs/synctex-store";

export function useCodeStore() {
  const cacheRef = useRef<Map<string, Promise<string>>>(new Map());
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return useMemo(() => new TexStore(urlGetters.texDirectory, cacheRef.current), [urlGetters]);
}
