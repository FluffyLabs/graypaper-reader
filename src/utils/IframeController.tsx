import {deserializeLocation} from "./location";

export type OutlineItem = {
  id: string,
  text: string,
};
export type Outline = OutlineItem[];

export type Section = {
  number: string,
  title: string,
};

export type InDocLocation = {
  page: string,
  section?: Section,
  subSection?: Section,
};

export type InDocSelection = {
  selection: DocumentFragment,
  location: InDocLocation,
};

export class IframeController {
  private readonly win: Window;
  private readonly doc: Document;

  private readonly location: InDocLocation;
  private selection: InDocSelection | null;

  constructor(win: Window) {
    this.win = win;
    this.doc = win.document;
    this.location = {
      page: '0',
    };
    this.selection = null;
  }

  injectStyles() {
    const $style = this.doc.createElement('style');
    $style.innerHTML = 'img { pointer-events: none };';
    this.doc.head.appendChild($style)
  }

  toggleSidebar(open?: boolean) {
    const classList = this.doc.querySelector('#sidebar')?.classList;
    if (open === undefined) {
      classList?.toggle('opened');
    } else if (open) {
      classList?.add('opened');
    } else {
      classList?.remove('opened');
    }
  }

  getOutline(): Outline {
    const $outline = this.doc.querySelectorAll('#outline a');
    const ret: Outline = [];
    for (const e of $outline) {
      const text = e.innerHTML;
      const id = e.getAttribute('data-dest-detail') ?? '';
      ret.push({ id, text });
    }
    return ret;
  }

  goToLocation(hash: string): [(() => void) | null, string | null] {
    const loc = deserializeLocation(hash);
    if (!loc) {
      return [null, null];
    }

    const classes = loc.selection
      .filter(x => x.startsWith('<div '))
      .map(x => x.substring('<div class="'.length, x.indexOf('>') - 1).split(' ').join('.'));

    const $page = this.doc.querySelector(`div[data-page-no="${loc.page}"] > .pc`);

    const $divs = classes.map(c => $page?.querySelector(`div.${c}`)).filter(x => x !== null);
    if (!$divs.length) {
      console.warn('Did not find any divs:', $divs, classes, $page);
      return [null, loc.version];
    }
    const range = this.doc.createRange();
    const $first = $divs[0];
    const $last = $divs[$divs.length - 1];
    if ($first && $last) {
      range.setStart($first, 0);
      range.setEndAfter($last);

      // select the range
      this.doc.getSelection()?.addRange(range);
      this.updateLocation($first)
      this.updateSelection();

      // open the page and scroll to it
      $page?.classList?.add('opened');
      const timeout = setTimeout(() => {
        const rect = $first?.getBoundingClientRect();
        // move to the first div and select all
        if (rect) {
          this.doc.querySelector('#page-container')?.scrollTo({
            top: rect.y - 100,
            left: rect.x,
            behavior: 'smooth'
          });
        }
      }, 50);

      return [() => clearTimeout(timeout), loc.version];
    }

    return [null, loc.version];
  }

  jumpTo(id: string) {
    const encoded = id.replace(/"/g, '\\"');
    const $elem = this.doc.querySelector(`a[data-dest-detail="${encoded}"]`);
    const $e = $elem as HTMLElement | null;
    $e?.click();
  }

  trackMouseLocation(updateLocation: (loc: InDocLocation, sel: InDocSelection | null) => void) {
    let lastRun = Date.now();
    // we alternate between looking for different components of location
    // to avoid pausing the world
    let finder = 0;
    const listener = (ev: MouseEvent) => {
      const now = Date.now();
      // debounce running
      if (now - lastRun < 25) {
        return
      }
      lastRun = now;

      const $elem = this.doc.elementFromPoint(ev.clientX, ev.clientY);
      this.updateLocation($elem, finder);
      updateLocation({...this.location}, this.selection);
      finder = (finder + 1) % 2;
    };

    const listener2 = () => {
      this.updateSelection();
      updateLocation({...this.location}, this.selection);
    };

    this.win.addEventListener('mousemove', listener);
    this.win.addEventListener('mouseup', listener2);
    return () => {
      this.win.removeEventListener('mousemove', listener);
      this.win.removeEventListener('mouseup', listener2);
    };
  }

  updateSelection() {
    // TODO [ToDr] update only on mouseup?
    const selection = this.doc.getSelection();
    if (selection && selection.rangeCount && !selection.isCollapsed) {
      this.selection = {
        selection: selection.getRangeAt(0).cloneContents(),
        location: {...this.location},
      };
    } else {
      this.selection = null;
    }
  }

  updateLocation($elem: Element | null, finder?: number) {
      if (!finder || finder === 0) {
        const page = findPage($elem);
        if (page) {
          this.location.page = page;
        }
      }

      if (!finder || finder === 1) {
        const section = findSection($elem);
        const subSection = findSubSection($elem) ?? undefined; 

        if (section) {
          this.location.section = section;
          // only set subsection if it's number is greater
          this.location.subSection = isWithinSection(section, subSection) ? subSection : undefined;
        }
      }
  }
}

function isWithinSection(section: Section, subSection?: Section) {
  if (!subSection) {
    return false;
  }

  const sectionNo = section.number.split('.')[0];
  const subNo = subSection.number.split('.')[0];
  return subNo === sectionNo;
}

function findSection($elem: Element | null): Section | null {
  if ($elem?.classList?.contains('opened')) {
    return null;
  }
  const section = findPreviousMatching($elem, (e) => e.querySelector('span._3 + span.ff5:nth-child(2):last-child'));
  if (section === null) {
    return null;
  }
  const title = section.textContent ?? '';
  const number = section.previousSibling?.previousSibling?.textContent ?? '';
  return { number, title };
}

function findSubSection($elem: Element | null): Section | null {
  const subSection = findPreviousMatching($elem, (e) => e.querySelector('span._3 + span.ff1:nth-child(2)'));
  if (subSection === null) {
    return null;
  }
  const text = subSection.textContent ?? '';
  const firstDot = text.indexOf('.');
  const title = text.substring(0, firstDot !== -1 ? firstDot : text.length);
  const number = subSection.previousSibling?.previousSibling?.textContent ?? '';
  return { number, title };
}

function findPage($elem: Element | null): string | null {
  const pageFromParent = findMatchingParent($elem, (x) => x.getAttribute('data-page-no'));
  if (pageFromParent) {
    return pageFromParent;
  }

  return null;
 }

function findPreviousMatching<T>($elem: Element | null, extract: (e: Element) => T | null) {
  if ($elem === null) {
    return null;
  }
  // early exit if we are at the page level
  if ($elem?.classList?.contains('opened')) {
    return null;
  }

  let $current = $elem;
  for (;;) {
    // exit early if we are off the page
    if ($current.id === 'page-container') {
      return null;
    }
  
    const matching = extract($current);
    if (matching !== null) {
      return matching;
    }
    if ($current.previousElementSibling === null) {
      let $nextCurrent = null;
      // we've reached the end of the current element, let's try parent.
      let $parent = $current.parentElement;
      // we are at the top-level node of the page, but we don't stop there.
      if ($parent?.classList?.contains('opened')) {
        $parent = $parent?.parentElement;
      }
      // if parent is a page, we need to do page transition.
      if ($parent?.hasAttribute('data-page-no')) {
        // jump to the previous page
        const $prevPage = $parent?.previousElementSibling;
        // but enter the last element
        $nextCurrent = $prevPage?.querySelector('div.pc > div:last-of-type') ?? null;
      } else {
        // otherwise just simply analyze the parent and go to the prev node
        $nextCurrent = $parent;
      }

      if ($nextCurrent === null) {
        return null;
      }
      $current = $nextCurrent;
      continue;
    }
    $current = $current.previousElementSibling;
  } 
}

function findMatchingParent<T>($elem: Element | null, extract: (e: Element) => T | null) {
  if ($elem === null) {
    return null;
  }

  let $current = $elem;
  for(;;) {
    // exit early if we are off the page
    if ($current.id === 'page-container') {
      return null;
    }

    const matching = extract($current);
    if (matching !== null) {
      return matching;
    }
    if ($current.parentElement === null) {
      return null;
    }
    $current = $current.parentElement;
  }
}
