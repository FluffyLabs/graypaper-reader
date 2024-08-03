export type OutlineItem = {
  id: string,
  text: string,
};
export type Outline = OutlineItem[];

export type InDocLocation = {
  page: number,
  section: string,
};

export class IframeController {
  private readonly win: Window;
  private readonly doc: Document;

  private readonly location: InDocLocation;

  constructor(win: Window) {
    this.win = win;
    this.doc = win.document;
    this.location = {
      page: 0,
      section: '',
    };
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

  getSelection(): string {
    return this.doc.getSelection()?.toString() ?? '';
  }

  jumpTo(id: string) {
    const encoded = id.replace(/"/g, '\\"');
    const $elem = this.doc.querySelector(`a[data-dest-detail="${encoded}"]`);
    const $e = $elem as HTMLElement | null;
    $e?.click();
  }

  trackMouseLocation(updateLocation: (loc: InDocLocation) => void) {
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
      if (finder === 0) {
        const page = findPage($elem);
        if (page) {
          this.location.page = page;
        }
      }

      if (finder === 1) {
        const section = findSection($elem);
        if (section) {
          this.location.section = section;
        }
      }

      updateLocation({...this.location});
      finder = (finder + 1) % 2;
    };

    this.win.addEventListener('mousemove', listener);
    return () => this.win.removeEventListener('mousemove', listener);
  }
}

function findSection($elem: Element | null): string | null {
  if ($elem?.classList?.contains('opened')) {
    return null;
  }
  const section = findPreviousMatching($elem, (e) => e.querySelector('span._3 + span.ff5:nth-child(2):last-child'));
  return section?.textContent ?? null;
}

function findPage($elem: Element | null): number {
  const pageFromParent = findMatchingParent($elem, (x) => x.getAttribute('data-page-no'));
  if (pageFromParent) {
    return Number(pageFromParent);
  }
  
  // fallback to finding an open page
  const $pages = $elem?.ownerDocument.querySelectorAll('.pc.opened');
  const pageNo = $pages ? $pages[0]?.parentElement?.getAttribute('data-page-no') : '0';
  return Number(pageNo ?? '0');
}

function findPreviousMatching<T>($elem: Element | null, extract: (e: Element) => T | null) {
  if ($elem === null) {
    return null;
  }
  let $current = $elem;
  do {
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
  } while (true);
}

function findMatchingParent<T>($elem: Element | null, extract: (e: Element) => T | null) {
  if ($elem === null) {
    return null;
  }

  let $current = $elem;
  do {
    const matching = extract($current);
    if (matching !== null) {
      return matching;
    }
    if ($current.parentElement === null) {
      return null;
    }
    $current = $current.parentElement;
  } while (true);
}
