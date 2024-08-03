import './Selection.css';
import {InDocLocation, Section} from "../../utils/IframeController";

type SelectionProps = {
  location: InDocLocation,
  selection: string | null,
};

export function Selection({ location, selection}: SelectionProps) {
  return (
    <div className="selection">
      <blockquote>
        {selection ? selection : '[no text selected]'}
      </blockquote>
      <small>
        <span>p:{location.page} &gt; {displaySection(location.section)} &gt; {displaySection(location.subSection)}</span>
      </small>
      <div className="actions">
        <button disabled={!selection}>Link</button>
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
