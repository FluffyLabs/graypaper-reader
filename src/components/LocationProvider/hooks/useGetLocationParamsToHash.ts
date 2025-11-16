import { useCallback } from "react";
import { useMetadataContext } from "../../MetadataProvider/MetadataProvider";
import type { ILocationParams } from "../types";
import { locationParamsToHash } from "../utils/locationParamsToHash";

export const useGetLocationParamsToHash = () => {
  const metaDataContext = useMetadataContext();
  const { metadata } = metaDataContext;
  const getHashFromLocationParams = useCallback(
    (params: ILocationParams) => {
      const hash = locationParamsToHash(params, metadata);
      return hash;
    },
    [metadata],
  );

  return { getHashFromLocationParams };
};
