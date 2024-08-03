import './Selection.css';
import {InDocLocation, Section} from "../../utils/IframeController";

type SelectionProps = {
  location: InDocLocation,
};

export function Selection({ location }: SelectionProps) {
  return (
    <div className="selection">
      <blockquote>
        {location.selection ? Array.from(location.selection.children).map(x => x.textContent) : '[no text selected]'}
      </blockquote>
      <small>
        <span>p:{location.page} &gt; {displaySection(location.section)} &gt; {displaySection(location.subSection)}</span>
      </small>
      <div className="actions">
        <button disabled={!location.selection}>Link</button>
        <button disabled={!location.selection}>Explain</button>
        <button disabled={!location.selection}>Add note</button>
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
