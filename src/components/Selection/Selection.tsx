import './Selection.css';
import {InDocLocation, InDocSelection, Section} from "../../utils/IframeController";
import {useCallback, useState} from 'react';
import {serializeLocation} from '../../utils/location';

type SelectionProps = {
  version: string,
  location: InDocLocation,
  selection: InDocSelection | null,
};

export function Selection({ version, location, selection }: SelectionProps) {
  const [linkCreated, setLinkCreated] = useState(false);

  const createLink = useCallback(() => {
    if (!selection) {
      return;
    }

    const loc = serializeLocation(version, selection);
    const encoded = btoa(unescape(encodeURIComponent(loc)));
    window.history.replaceState(null, '', document.location.pathname + '#' + encoded);
    window.navigator.clipboard.writeText(window.location.toString());
    setLinkCreated(true);
    window.setTimeout(() => setLinkCreated(false), 2000);
  }, [selection, version]);

  // location is either the constant location from the selection or dynamic location.
  const loc = selection ? selection.location : location;
  return (
    <div className="selection">
      <blockquote>
        {selection ? Array.from(selection.selection.children).map(x => x.textContent) : '[no text selected]'}
      </blockquote>
      <small>
        <span>p:{Number(`0x${loc.page}`)} &gt; {displaySection(loc.section)} &gt; {displaySection(loc.subSection)}</span>
      </small>
      <div className="actions">
        <button disabled={!selection} onClick={createLink}>{linkCreated ? (<span>Copied</span>) : 'Link'}</button>
        <button disabled={!selection}>Explain</button>
        <button disabled={!selection}>Add note</button>
      </div>
    </div>
  );
}

function displaySection(section?: Section) {
  if (!section) {
    return '??';
  }

  return `${section.number} ${section.title}`;
}
