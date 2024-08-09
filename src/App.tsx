import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

import { Banner } from "./components/Banner/Banner";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ThemeToggler } from "./components/ThemeToggler/ThemeToggler";
import { IframeController } from "./utils/IframeController";
import { getInitialVersion, grayPaperMetadata } from "./utils/metadata";

export function App() {
  const frame = useRef(null as HTMLIFrameElement | null);
  const [loadedFrame, setLoadedFrame] = useState(null as IframeController | null);
  const [version, setVersion] = useState(getInitialVersion(grayPaperMetadata));

  const onSetVersion = useCallback(
    (v: string) => {
      if (v !== version) {
        setLoadedFrame(null);
      }
      setVersion(v);
    },
    [version],
  );

  // wait for the iframe content to load.
  useEffect(() => {
    const interval = setInterval(() => {
      const $frame = frame.current;
      const win = $frame?.contentWindow;
      if (win && win.document.readyState === "complete") {
        setLoadedFrame(new IframeController(win, version));
        clearInterval(interval);
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [version]);

  return (
    <>
      <Banner />
      {loadedFrame && <ThemeToggler iframeCtrl={loadedFrame} />}
      <iframe
        className={loadedFrame ? "visible" : ""}
        title="Gray Paper"
        name="gp"
        ref={frame}
        src={`graypaper-${version}.html`}
      />
      {loadedFrame && (
        <Sidebar
          metadata={grayPaperMetadata}
          selectedVersion={version}
          onVersionChange={onSetVersion}
          iframeCtrl={loadedFrame}
        />
      )}
    </>
  );
}
