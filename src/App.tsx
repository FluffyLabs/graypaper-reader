import {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import {Outline} from './components/Outline/Outline';
import {IframeController, InDocLocation, Outline as OutlineType } from './utils/IframeController';
import {Tabs} from './components/Tabs/Tabs';
import {Selection} from './components/Selection/Selection';

import grayPaperMetadata from '../public/metadata.json';
import {Version} from './components/Version/Version';
import {getLatestVersion} from './components/Version/util';

export function App() {
  const frame = useRef(null as HTMLIFrameElement | null);
  const [loadedFrame, setLoadedFrame] = useState(null as IframeController | null);
  const [version, setVersion] = useState(getLatestVersion(grayPaperMetadata));

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
        clearInterval(interval);
      }
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [frame]);

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
  const [location, setLocation] = useState({ page: 0 } as InDocLocation);
  const [outline, setOutline] = useState([] as OutlineType);
  
  // perform one-time operations.
  useEffect(() => {
    setOutline(iframeCtrl.getOutline());

    iframeCtrl.injectStyles();
    iframeCtrl.toggleSidebar(false);
  }, [iframeCtrl]);

  // maintain location within document
  useEffect(() => {
    return iframeCtrl.trackMouseLocation((loc) => setLocation(loc));
  }, [iframeCtrl]);

  const jumpTo = useCallback((id: string) => {
    iframeCtrl.jumpTo(id);
  }, [iframeCtrl]);

  return (
    <div className="viewer">
      <Selection location={location}></Selection>
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
