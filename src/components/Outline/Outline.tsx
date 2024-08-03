import './Outline.css';
import type { InDocLocation, Outline } from '../../utils/IframeController';

type OutlineProps = {
  outline: Outline,
  location: InDocLocation,
  jumpTo: (id: string) => void,
};

export function Outline({
  outline,
  location,
  jumpTo
} :  OutlineProps) {
  return <>
    <div className="outline">
      <ul>
        {outline.map(x => (
          <li key={x.id} className={isSameSection(x.text, location) ? 'active' : ''}>
            <a onClick={() => jumpTo(x.id)}>
              {x.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </>
}

function isSameSection(name: string, location: InDocLocation) {
  const matchesSection = name.indexOf(location.section?.title ?? '') !== -1;
  const matchesSubSection = name.indexOf(location.subSection?.title ?? '') !== -1;

  return matchesSection || matchesSubSection;
}
