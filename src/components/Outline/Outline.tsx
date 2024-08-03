import './Outline.css';
import type { InDocLocation, Outline, OutlineItem } from '../../utils/IframeController';
import {ReactNode, useCallback, useMemo} from 'react';

type OutlineProps = {
  outline: Outline,
  location: InDocLocation,
  jumpTo: (id: string) => void,
};

export function Outline({
  outline,
  location,
  jumpTo,
} :  OutlineProps) {
  const nestedOutline = useMemo(() => {
    const nested = {} as { [key: string]: Outline };
    for (const o of outline) {
      const number = o.text.split('.')[0].replace('Appendix ', '');
      const arr = nested[number] ?? [];
      arr.push(o);
      nested[number] = arr;
    }
    return nested;
  }, [outline]);

  return (
    <div className="outline">
      <ul>
        {Object.entries(nestedOutline).map(([, items]) => (
          <Item key={items[0].id} item={items[0]} location={location} jumpTo={jumpTo}>
            {items.length > 1 && (
              <ul>
                {items.slice(1).map(i => <Item key={i.id} item={i} location={location} jumpTo={jumpTo} />)}
              </ul>
            )}
          </Item>
        ))}
      </ul>
    </div>
  );
}
type ItemProps = {
  item: OutlineItem,
  location: InDocLocation,
  jumpTo: OutlineProps["jumpTo"],
  children?: ReactNode,
};
function Item({item, location, jumpTo, children }: ItemProps) {
  const handleClick = useCallback(() => {
    jumpTo(item.id);
  }, [jumpTo, item]);

  return (
    <li className={isSameSection(item.text, location) ? 'active' : ''}>
      <a onClick={handleClick}>{item.text}</a>
      {children}
    </li>
  );
}

function isSameSection(name: string, location: InDocLocation) {
  const matchesSection = location.section && name.indexOf(location.section.title) !== -1;
  const matchesSubSection = location.subSection && name.indexOf(location.subSection.title ?? '') !== -1;

  return matchesSection || matchesSubSection;
}
