export type OutlineItem = {
  id: string,
  text: string,
};
export type Outline = OutlineItem[];

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
}
