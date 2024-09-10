import "./Outline.css";
import { type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { PdfContext } from "../PdfProvider/PdfProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";
import { PDFDocumentProxy } from "pdfjs-dist";

export type TOutline = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>;

export function Outline() {
  const [outline, setOutline] = useState<TOutline>([]);
  const { pdfDocument } = useContext(PdfContext) as IPdfContext;

  // perform one-time operations.
  useEffect(() => {
    pdfDocument?.getOutline().then((outline) => setOutline(outline));
  }, [pdfDocument]);

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

  return (
    <a href="#" onClick={handleClick}>
      {children}
    </a>
  );
}
