export type OutlineItem = {
  id: string,
  text: string,
};
export type Outline = OutlineItem[];

export type InDocLocation = {
  page: number,
};

export class IframeController {
  private win: Window;
  private doc: Document;

  constructor(win: Window) {
    this.win = win;
    this.doc = win.document;
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
    $elem?.click();
  }

  trackMouseLocation(updateLocation: (loc: InDocLocation) => void) {
    let lastRun = Date.now();
    const listener = (ev: MouseEvent) => {
      const now = Date.now();
      // debounce running
      if (now - lastRun < 50) {
        return
      }
      lastRun = now;
      const $elem = this.doc.elementFromPoint(ev.clientX, ev.clientY);
      const page = findPage($elem);
      updateLocation({ page });
    };

    this.win.addEventListener('mousemove', listener);
    return () => this.win.removeEventListener('mousemove', listener);
  }
}

function findPage($elem: Element | null): number {
  let current = $elem;
  do {
    const p = current?.getAttribute('data-page-no');
    if (p) {
      return Number(p);
    }
    current = current?.parentElement ?? null;
  } while (current !== null);

  // fallback to finding an open page
  const $pages = $elem?.ownerDocument.querySelectorAll('.pc.opened');
  const pageNo = $pages ? $pages[0]?.getAttribute('data-page-no') : '0';
  return Number(pageNo ?? '0');
}
