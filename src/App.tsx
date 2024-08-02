import {useEffect, useRef, useState} from 'react';
import './App.css'

export function App() {
  const frame = useRef(null as HTMLIFrameElement | null);
  const [loadedFrame, setLoadedFrame] = useState(null as HTMLIFrameElement | null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (frame.current?.contentWindow) {
        frame.current?.contentWindow.addEventListener('load', () => {
          setLoadedFrame(frame.current);
        });
        clearInterval(interval);
      }
    })
    return () => {
      clearInterval(interval);
    };
  }, [frame.current]);

  return (
    <>
      <iframe name="gp" ref={frame} src="graypaper.html"></iframe>
      <Viewer gpFrame={loadedFrame}></Viewer>
    </>
  )
}

function Viewer({ gpFrame }: { gpFrame: HTMLIFrameElement | null}) {
  const [selection, setSelection] = useState('');
  const [outline, setOutline] = useState([] as [string, string][]);
  
  // get outline once
  useEffect(() => {
    const doc = gpFrame?.contentWindow?.document;

    if (!doc) {
      return;
    }

    // get outline
    const $outline = doc.querySelectorAll('#outline a');
    setOutline(convertOutline($outline));
    doc.querySelector('#sidebar')?.classList.remove('opened');
  }, [gpFrame?.contentWindow?.document]);

  // maintain selection
  useEffect(() => {
    const interval = window.setInterval(()=> {
      const doc = gpFrame?.contentWindow?.document;
      if (!doc) {
        return;
      }
      // get selection
      const $select = doc.getSelection();
      setSelection($select?.toString() ?? '');
    }, 200);
    return () => {
      window.clearInterval(interval);
    };
  }, [gpFrame]);

  return (
    <div className="viewer">
      <div className="actions">
        <button>outline</button>
        <button>notes</button>
        <button>glossary</button>
      </div>
      <div className="selection">
        <h3>Selection:</h3>
        <blockquote>{selection}</blockquote>
       <div className="actions">
          {selection && <button>Explain</button>}
          {selection && <button>Add note</button>}
        </div>
      </div>
      <h3>Notes:</h3>
      TODO
      <h3>Outline:</h3>
      <div className="outline">
        <ul>
          {outline.map(x => <li key={x[0]}><a target="gp" href={`graypaper.html${x[0]}`}>{x[1]}</a></li>)}
        </ul>
      </div>
    </div>
  );
}

function convertOutline($outline: NodeListOf<Element>): [string, string][] {
  const ret = [] as [string, string][];
  for (const e of $outline) {
    const text = e.innerHTML;
    const id = e.getAttribute('href') ?? '';
    ret.push([id, text]);
  }
  return ret;
}

