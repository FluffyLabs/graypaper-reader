import { createContext, useContext, useMemo } from "react";
import { useLocationContext } from "./LocationProvider";

const versionContext = createContext<{ version: string } | undefined>(undefined);

export const useVersionContext = () => {
  const context = useContext(versionContext);

  if (!context) {
    throw new Error("useVersionContext must be used within a VersionProvider");
  }

  return context;
};

export const VersionProvider = ({ children }: { children: React.ReactNode }) => {
  const locationContext = useLocationContext();

  const context = useMemo(
    () => ({
      version: locationContext.locationParams.version,
    }),
    [locationContext.locationParams.version],
  );

  return <versionContext.Provider value={context}>{children}</versionContext.Provider>;
};
