import './Outline.css';
import type { Outline } from '../../utils/IframeController';

export function Outline({ outline, jumpTo } : { outline: Outline, jumpTo: (id: string) => void }) {
  return <>
    <div className="outline">
      <ul>
        {outline.map(x => (
          <li key={x.id}>
            <a href={`#${x.id}`} onClick={() => jumpTo(x.id)}>
              {x.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  </>
}
