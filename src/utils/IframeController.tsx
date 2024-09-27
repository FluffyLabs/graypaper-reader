import { deserializeLocation } from "./location";

export type OutlineItem = {
  id: string;
  text: string;
};
export type Outline = OutlineItem[];

export type Section = {
  number: string;
  title: string;
};

export type InDocLocation = {
  page: string;
  section?: Section;
  subSection?: Section;
};

export type InDocSelection = {
  selection: DocumentFragment;
  location: InDocLocation;
};

const customStyles = `
// Disable drag&drop on background.
img {
  pointer-events: none;
}

/* Always hide the sidebar. */
#sidebar {
  display: none !important;
}
#sidebar.opened+#page-container {
  left: 0 !important;
}

body.theme-light img.bi {
  filter: invert(100%) brightness(150%);
}
body.theme-light .fc0 {
  color: #111;
}
body.theme-light ::selection {
  background: rgba(127, 180, 180, 0.4);
}
`;

export class IframeController {
  /** The inner (within iframe) window and document. */
  private readonly win: Window;
  private readonly doc: Document;

  /** Current location and selection **/
  private readonly location: InDocLocation;
  private selection: InDocSelection | null;

  private updateLocationListener: () => void;

  constructor(win: Window, _v: string) {
    this.win = win;
    this.doc = win.document;
    this.location = {
      page: "0",
    };
    this.selection = null;
    this.updateLocationListener = () => {};
  }

  injectStyles() {
    const $style = this.doc.createElement("style");
    $style.innerHTML = customStyles;
    this.doc.head.appendChild($style);
  }

  toggleTheme(isLight?: boolean) {
    const clazz = "theme-light";
    const classList = this.doc.body.classList;
    if (isLight === false) {
      classList.remove(clazz);
    } else if (isLight === true) {
      classList.add(clazz);
    } else {
      classList.toggle(clazz);
    }
    return classList.contains(clazz);
  }

  getOutline(): Outline {
    const $outline = this.doc.querySelectorAll("#outline a");
    const ret: Outline = [];
    for (const e of $outline) {
      const text = e.innerHTML;
      const id = e.getAttribute("data-dest-detail") ?? "";
      ret.push({ id, text });
    }
    return ret;
  }

  goToLocation(hash: string): [(() => void) | null, string | null] {
    const loc = deserializeLocation(hash);
    if (!loc || !loc.selection) {
      return [null, null];
    }

    const DIV_PATTERN = '<div class="';

    const classes = loc.selection
      .filter((x) => x.startsWith(DIV_PATTERN))
      .map((x) =>
        x
          .substring(DIV_PATTERN.length, x.indexOf(">") - 1)
          .split(" ")
          .join("."),
      );

    const $page = this.doc.querySelector(`div[data-page-no="${loc.page}"] > .pc`);

    let $divs: (Element | null | undefined)[];
    try {
      $divs = classes.map((c) => $page?.querySelector(`div.${c}`)).filter((x) => x !== null);
      if (!$divs.length) {
        console.warn("Did not find any divs:", loc.selection, classes, $divs, $page);
        // we can at least try to go to the page.
        $page?.parentElement?.scrollIntoView({ block: "start", behavior: "smooth" });
        return [null, loc.shortVersion];
      }
    } catch (e) {
      console.warn("Invalid querySelector created", e);
      return [null, loc.shortVersion];
    }

    const range = this.doc.createRange();
    const $first = $divs[0];
    const $last = $divs[$divs.length - 1];
    if ($first && $last) {
      range.setStart($first, 0);
      range.setEndAfter($last);

      // select the range
      const selection = this.doc.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      this.updateLocation($first);
      this.updateSelection();

      // open the page and scroll to it
      $page?.classList?.add("opened");

      // scroll to that element
      const scrollTo = (block: "start" | "center", behavior: "smooth" | "instant") => {
        $first.scrollIntoView({
          behavior,
          block,
        });
      };
      scrollTo("start", "smooth");

      const timeout = setTimeout(() => {
        // now try to scroll to the center
        // TODO [ToDr] scrolling only to the `center` makes it unpredictable
        // sometimes it does work and sometimes it does not?
        scrollTo("center", "instant");
      }, 300);

      return [() => clearTimeout(timeout), loc.shortVersion];
    }

    return [null, loc.shortVersion];
  }

  jumpTo(id: string) {
    const encoded = id.replace(/"/g, '\\"');
    const $elem = this.doc.querySelector(`a[data-dest-detail="${encoded}"]`);
    const $e = $elem as HTMLElement | null;
    $e?.click();

    // Because we have a banner on top, we need to move the scroll a bit.
    setTimeout(() => {
      const $pageContainer = this.doc.querySelector("#page-container");
      $pageContainer?.scrollTo({
        top: $pageContainer?.scrollTop - 100,
      });

      const $elem = this.doc.elementFromPoint(($pageContainer?.clientWidth ?? this.win.innerWidth) / 3, 100);
      this.updateLocation($elem);
      this.updateLocationListener();
    }, 50);
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
        return;
      }
      lastRun = now;

      const $elem = this.doc.elementFromPoint(ev.clientX, ev.clientY);
      this.updateLocation($elem, finder);
      this.updateLocationListener();
      finder = (finder + 1) % 2;
    };

    const listener2 = () => {
      this.updateSelection();
      this.updateLocationListener();
    };

    this.updateLocationListener = () => {
      updateLocation({ ...this.location }, this.selection);
    };
    this.win.addEventListener("mousemove", listener);
    this.win.addEventListener("mouseup", listener2);
    return () => {
      this.win.removeEventListener("mousemove", listener);
      this.win.removeEventListener("mouseup", listener2);
    };
  }

  updateSelection() {
    const selection = this.doc.getSelection();
    if (selection?.rangeCount && !selection.isCollapsed) {
      const range = selection.getRangeAt(0).cloneRange();
      // extend the selection if it's only text nodes.
      const extendRange = ($elem: Node, set: (n: Node) => void) => {
        if ($elem.nodeType === Node.TEXT_NODE) {
          if ($elem.parentElement) {
            set($elem.parentElement);
          }
        }
      };
      extendRange(range.startContainer, ($e) => range.setStart($e, 0));
      extendRange(range.endContainer, ($e) => range.setEndAfter($e));
      this.selection = {
        selection: range.cloneContents(),
        location: { ...this.location },
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

  getSelection() {
    return this.selection;
  }
}

function isWithinSection(section: Section, subSection?: Section) {
  if (!subSection) {
    return false;
  }

  const sectionNo = section.number.split(".")[0];
  const subNo = subSection.number.split(".")[0];
  return subNo === sectionNo;
}

function findSection($elem: Element | null): Section | null {
  if ($elem?.classList?.contains("opened")) {
    return null;
  }
  // newer versions
  let section = findPreviousMatching($elem, (e) => e.querySelector("span._2 + span.ff5:nth-child(2):last-child"));
  if (section === null) {
    // old versions fallback
    section = findPreviousMatching($elem, (e) => e.querySelector("span._3 + span.ff5:nth-child(2):last-child"));
  }
  if (section === null) {
    return null;
  }
  const title = section.textContent ?? "";
  const number = section.previousSibling?.previousSibling?.textContent ?? "";
  return { number, title };
}

function findSubSection($elem: Element | null): Section | null {
  // newer versions
  let subSection = findPreviousMatching($elem, (e) => e.querySelector("span._2 + span.ff1:nth-child(2)"));
  if (subSection === null) {
    // old versions fallback
    subSection = findPreviousMatching($elem, (e) => e.querySelector("span._3 + span.ff1:nth-child(2)"));
    return null;
  }
  if (subSection === null) {
    return null;
  }
  const text = subSection.textContent ?? "";
  const firstDot = text.indexOf(".");
  const title = text.substring(0, firstDot !== -1 ? firstDot : text.length);
  const number = subSection.previousSibling?.previousSibling?.textContent ?? "";
  return { number, title };
}

function findPage($elem: Element | null): string | null {
  const pageFromParent = findMatchingParent($elem, (x) => x.getAttribute("data-page-no"));
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
  if ($elem?.classList?.contains("opened")) {
    return null;
  }

  let $current = $elem;
  for (;;) {
    // exit early if we are off the page
    if ($current.id === "page-container") {
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
      if ($parent?.classList?.contains("opened")) {
        $parent = $parent?.parentElement;
      }
      // if parent is a page, we need to do page transition.
      if ($parent?.hasAttribute("data-page-no")) {
        // jump to the previous page
        const $prevPage = $parent?.previousElementSibling;
        // but enter the last element
        $nextCurrent = $prevPage?.querySelector("div.pc > div:last-of-type") ?? null;
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
  for (;;) {
    // exit early if we are off the page
    if ($current.id === "page-container") {
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
