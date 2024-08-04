import {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import {Outline} from './components/Outline/Outline';
import {IframeController, InDocLocation, InDocSelection, Outline as OutlineType } from './utils/IframeController';
import {Tabs} from './components/Tabs/Tabs';
import {Selection} from './components/Selection/Selection';

import grayPaperMetadata from '../public/metadata.json';
import {Version} from './components/Version/Version';
import {getLatestVersion} from './components/Version/util';
import {deserializeLocation} from './utils/location';

export function App() {
  const frame = useRef(null as HTMLIFrameElement | null);
  const [loadedFrame, setLoadedFrame] = useState(null as IframeController | null);
  const [version, setVersion] = useState(getInitialVersion());

  // wait for the iframe content to load.
  useEffect(() => {
    const interval = setInterval(() => {
      const win = frame.current?.contentWindow;
      if (win) {
        if (win.document.readyState === 'complete') {
          setLoadedFrame(new IframeController(win));
        } else {
          win.addEventListener('load', () => {
            setLoadedFrame(new IframeController(win));
          });
        }
        console.log('Iframe loaded');
        clearInterval(interval);
      }
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [frame, version]);

  return (
    <>
      <iframe name="gp" ref={frame} src={`graypaper-${version}.html`}></iframe>
      {loadedFrame && <Viewer
        selectedVersion={version}
        onVersionChange={setVersion}
        iframeCtrl={loadedFrame}
      ></Viewer>}
    </>
  )
}

type ViewerProps = {
  iframeCtrl: IframeController,
  selectedVersion: string,
  onVersionChange: (v: string) => void
};

function Viewer({ iframeCtrl, selectedVersion, onVersionChange }: ViewerProps) {
  const [location, setLocation] = useState({ page: '0' } as InDocLocation);
  const [selection, setSelection] = useState(null as InDocSelection | null);
  const [outline, setOutline] = useState([] as OutlineType);
  
  // perform one-time operations.
  useEffect(() => {
    console.log('Hiding toolbar');
    setOutline(iframeCtrl.getOutline());

    iframeCtrl.injectStyles();
    iframeCtrl.toggleSidebar(false);
  }, [iframeCtrl]);

  // maintain location within document
  useEffect(() => {
    return iframeCtrl.trackMouseLocation((loc, sel) => {
      setLocation(loc);
      setSelection(sel);
    });
  }, [iframeCtrl]);

  // react to changes in hash location
  useEffect(() => {
    const listener = (ev: HashChangeEvent) => {
      const [, versionToSelect] = iframeCtrl.goToLocation('#' + ev.newURL.split('#')[1]);
      if (versionToSelect) {
        onVersionChange(versionToSelect);
      }
    };
    // read current hash
    const [cleanup, versionToSelect] = iframeCtrl.goToLocation(window.location.hash);
    if (versionToSelect) {
      onVersionChange(versionToSelect);
    }

    // react to hash changes
    window.addEventListener('hashchange', listener);
    return () => {
      window.removeEventListener('hashchange', listener);
      if (cleanup) {
        cleanup();
      }
    };
  }, [iframeCtrl, selectedVersion, onVersionChange]);

  const jumpTo = useCallback((id: string) => {
    iframeCtrl.jumpTo(id);
  }, [iframeCtrl]);

  return (
    <div className="viewer">
      <Selection version={selectedVersion} location={location} selection={selection} />
      <Tabs tabs={tabsContent(outline, location, jumpTo)} />
      <Version
        onChange={onVersionChange}
        metadata={grayPaperMetadata}
        selectedVersion={selectedVersion}
      />
    </div>
  );
}

function tabsContent(outline: OutlineType, location: InDocLocation, jumpTo: (id: string) => void) {
  return [{
    name: 'outline',
    render: () => <Outline outline={outline} jumpTo={jumpTo} location={location} />,
  }, {
    name: 'notes',
    render: () => 'todo',
  }];
}

function getInitialVersion(): string {
  const loc = deserializeLocation(window.location.hash);
  if (loc) {
    return loc.version;
  }

  return getLatestVersion(grayPaperMetadata);
}

