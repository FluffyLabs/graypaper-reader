import './Outline.css';
import type { Outline } from '../../utils/IframeController';

type OutlineProps = {
  outline: Outline,
  section: string,
  jumpTo: (id: string) => void,
};

export function Outline({
  outline,
  section,
  jumpTo
} :  OutlineProps) {
  return <>
    <div className="outline">
      <ul>
        {outline.map(x => (
          <li key={x.id} className={isSameSection(x.text, section) ? 'active' : ''}>
            <a href={`#${x.id}`} onClick={() => jumpTo(x.id)}>
              {x.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </>
}

function isSameSection(name: string, section: string) {
  return name.indexOf(section) !== -1;
}
