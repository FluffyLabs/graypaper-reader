import "./Outline.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { PdfContext } from "../PdfProvider/PdfProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";

export type TOutline = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>;

export function Outline({ searchIsDone }: { searchIsDone: boolean }) {
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { pdfDocument, linkService } = useContext(PdfContext) as IPdfContext;
  const [outline, setOutline] = useState<TOutline>([]);

  // Load the outline
  useEffect(() => {
    pdfDocument?.getOutline().then((outline) => setOutline(outline));
  }, [pdfDocument]);

  // scroll to section
  const section = locationParams.section?.toLowerCase();
  useEffect(() => {
    if (section === undefined || searchIsDone === false) {
      return;
    }
    const findItem = (outline: TOutline): TOutline[0] | undefined => {
      for (const item of outline) {
        if (item.title.toLowerCase().includes(section)) {
          return item;
        }
        const res = findItem(item.items);
        if (res !== undefined) {
          return res;
        }
      }
      return undefined;
    };

    const itemToScrollTo = findItem(outline);
    if (itemToScrollTo?.dest) {
      linkService?.goToDestination(itemToScrollTo.dest);
    }
  }, [searchIsDone, section, outline, linkService]);

  const renderOutline = (outline: TOutline) => {
    return (
      <ul>
        {outline.map((item) => (
          <li key={item.title}>
            <Link dest={item.dest}>{item.title}</Link>
            {item.items.length > 0 ? renderOutline(item.items) : null}
          </li>
        ))}
      </ul>
    );
  };

  if (!pdfDocument) return <div>Loading...</div>;

  return <div className="outline">{renderOutline(outline)}</div>;
}

type ILinkProps = {
  dest: TOutline[0]["dest"];
  children: ReactNode;
};

function Link({ dest, children }: ILinkProps) {
  const { linkService } = useContext(PdfContext) as IPdfContext;

  const handleClick = useCallback(() => {
    if (!dest) return;
    linkService?.goToDestination(dest);
  }, [linkService, dest]);

  return <a onClick={handleClick}>{children}</a>;
}
