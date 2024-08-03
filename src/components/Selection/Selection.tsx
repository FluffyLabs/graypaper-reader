import './Selection.css';
import {InDocLocation, Section} from "../../utils/IframeController";
import {useCallback, useState} from 'react';

type SelectionProps = {
  version: string,
  location: InDocLocation,
};

export function Selection({ version, location }: SelectionProps) {
  const [linkCreated, setLinkCreated] = useState(false);

  const createLink = useCallback(() => {
    const loc = serializeLocation(version, location);
    const encoded = btoa(unescape(encodeURIComponent(loc)));
    window.location.hash = encoded;
    window.navigator.clipboard.writeText(window.location.toString());
    setLinkCreated(true);
    window.setTimeout(() => setLinkCreated(false), 2000);
  }, [location, version]);
  return (
    <div className="selection">
      <blockquote>
        {location.selection ? Array.from(location.selection.children).map(x => x.textContent) : '[no text selected]'}
      </blockquote>
      <small>
        <span>p:{location.page} &gt; {displaySection(location.section)} &gt; {displaySection(location.subSection)}</span>
      </small>
      <div className="actions">
        <button disabled={!location.selection} onClick={createLink}>{linkCreated ? (<span>Copied</span>) : 'Link'}</button>
        <button disabled={!location.selection}>Explain</button>
        <button disabled={!location.selection}>Add note</button>
      </div>
    </div>
  );
}

function serializeLocation(version: string, location: InDocLocation) {
  return JSON.stringify([
    version,
    location.page,
    location.section?.title,
    location.subSection?.title,
    Array.from(location.selection?.children ?? []).map(x => x.innerHTML),
  ]);
}

function displaySection(section?: Section) {
  if (!section) {
    return '??';
  }

  return `${section.number} ${section.title}`;
}
