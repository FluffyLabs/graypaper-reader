import {useCallback, useEffect, useRef, useState} from 'react';
import './App.css';
import {Outline} from './components/Outline/Outline';
import {IframeController, Outline as OutlineType } from './utils/IframeController';
import {Tabs} from './components/Tabs/Tabs';

import grayPaperMetadata from '../public/metadata.json';
import {Version, getLatestVersion} from './components/Version/Version';

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
  }, [frame.current]);

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
  const [selection, setSelection] = useState('');
  const [outline, setOutline] = useState([] as OutlineType);
  
  // get outline once
  useEffect(() => {
    setOutline(iframeCtrl.getOutline());
    iframeCtrl.toggleSidebar(false);
  }, [iframeCtrl]);

  // TODO [ToDr] use a listener for that
  // maintain selection
  useEffect(() => {
    const interval = window.setInterval(()=> setSelection(iframeCtrl.getSelection()));
    return () => window.clearInterval(interval);
  }, [iframeCtrl]);

  const jumpTo = useCallback((id: string) => {
    iframeCtrl.jumpTo(id);
  }, [iframeCtrl]);

  return (
    <div className="viewer">
      <div className="selection">
        <blockquote>
          {selection ? selection : <small>no text selected</small>}
        </blockquote>
        <div className="actions">
          <button disabled={!selection}>Link</button>
          <button disabled={!selection}>Explain</button>
          <button disabled={!selection}>Add note</button>
        </div>
      </div>
      <Tabs tabs={tabsContent(outline, jumpTo)} />
      <Version
        onChange={onVersionChange}
        metadata={grayPaperMetadata}
        selectedVersion={selectedVersion}
      />
    </div>
  );
}

function tabsContent(outline: OutlineType, jumpTo: (id: string) => void) {
  return [{
    name: 'outline',
    render: () => <Outline outline={outline} jumpTo={jumpTo} />,
  }, {
    name: 'notes',
    render: () => 'todo',
  }];
}
