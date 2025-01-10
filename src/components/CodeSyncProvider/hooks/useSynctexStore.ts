import { SynctexStore } from "@fluffylabs/links-metadata";
import type { ISynctexData } from "@fluffylabs/links-metadata";
import { useContext, useMemo, useRef } from "react";
import { type IMetadataContext, MetadataContext } from "../../MetadataProvider/MetadataProvider";

export function useSynctexStore() {
  const cacheRef = useRef<Map<string, Promise<ISynctexData>>>(new Map());
  const { urlGetters } = useContext(MetadataContext) as IMetadataContext;

  return useMemo(() => new SynctexStore(urlGetters.synctex, cacheRef.current), [urlGetters]);
}
