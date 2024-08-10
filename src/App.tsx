import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

import { Banner } from "./components/Banner/Banner";
import { Resizable } from "./components/Resizable/Resizable";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ThemeToggler } from "./components/ThemeToggler/ThemeToggler";
import { IframeController } from "./utils/IframeController";
import { type Metadata, getInitialVersion, getMetadata, grayPaperUrl } from "./utils/metadata";

export function App() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  useEffect(() => {
    const fetch = async () => {
      setMetadata(await getMetadata());
    };
    fetch();
  }, []);

  return metadata && <InnerApp metadata={metadata} />;
}

function InnerApp({ metadata }: { metadata: Metadata }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [loadedFrame, setLoadedFrame] = useState<IframeController | null>(null);
  const [version, setVersion] = useState(getInitialVersion(metadata));
  const browserZoom = useBrowserZoom();

  const onSetVersion = useCallback(
    (v: string) => {
      if (v !== version) {
        setLoadedFrame(null);
      }
      setVersion(v);
    },
    [version],
  );

  const onIframeLoad = useCallback(() => {
    const $frame = frame.current;
    const win = $frame?.contentWindow;
    if (win?.document.readyState === "complete") {
      setLoadedFrame(new IframeController(win, version));
    }
  }, [version]);

  return (
    <Resizable
      left={
        <>
          <Banner />
          {loadedFrame && <ThemeToggler iframeCtrl={loadedFrame} />}
          <iframe
            className={loadedFrame ? "visible" : ""}
            title="Gray Paper"
            name="gp"
            ref={frame}
            src={grayPaperUrl(version)}
            onLoad={onIframeLoad}
          />
        </>
      }
      right={
        <>
          {loadedFrame && (
            <Sidebar
              metadata={metadata}
              selectedVersion={version}
              onVersionChange={onSetVersion}
              iframeCtrl={loadedFrame}
              zoom={browserZoom}
            />
          )}
        </>
      }
    />
  );
}

function useBrowserZoom() {
  const [initialPixelRatio, _] = useState(window.devicePixelRatio > 2.0 ? 2.0 : window.devicePixelRatio);
  const [browserZoom, setBrowserZoom] = useState(window.devicePixelRatio / initialPixelRatio);

  useEffect(() => {
    const $styles = document.createElement("style");
    $styles.type = "text/css";
    document.head.appendChild($styles);
    const listener = () => {
      const zoom = window.devicePixelRatio / initialPixelRatio;
      $styles.textContent = `.no-zoom { transform-origin: top left; transform: scale(${1.0 / zoom}); }`;
      setBrowserZoom(zoom);
    };
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [initialPixelRatio]);

  return browserZoom;
}
