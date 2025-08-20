import "./Outline.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
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

  const renderOutline = (outline: TOutline, options: { firstLevel?: boolean } = {}) => {
    const { firstLevel = false } = options;

    return (
      <ul className={twMerge(firstLevel ? "mt-0" : "my-3")}>
        {outline.map((item) => (
          <li key={item.title} className={twMerge(firstLevel ? "pl-0 mt-4" : "pl-4", "mt-0.5 first-of-type:mt-0")}>
            <Link
              dest={item.dest}
              className={twMerge(
                "underline underline-offset-2",
                !firstLevel && "dark:text-[var(--brand-light)] text-[var(--brand-darkest)] mt-0.5",
                firstLevel && "dark:text-[var(--brand)] text-[var(--brand-darkest-2)]",
              )}
            >
              {firstLevel && item.title.replace(".", " > ")}
              {!firstLevel && item.title}
            </Link>
            {item.items.length > 0 ? renderOutline(item.items) : null}
          </li>
        ))}
      </ul>
    );
  };

  if (!pdfDocument) return <div>Loading...</div>;

  return (
    <div className="rounded-lg min-h-0 w-full py-6 px-6  bg-[#eeeeee] dark:bg-[#323232]  overflow-y-auto">
      {renderOutline(outline, { firstLevel: true })}
    </div>
  );
}

type ILinkProps = {
  dest: TOutline[0]["dest"];
  children: ReactNode;
  className?: string;
};

function Link({ dest, children, className }: ILinkProps) {
  const { linkService } = useContext(PdfContext) as IPdfContext;

  const handleClick = useCallback(() => {
    if (!dest) return;
    linkService?.goToDestination(dest);
  }, [linkService, dest]);

  return (
    <a onClick={handleClick} className={twMerge("cursor-pointer hover:opacity-75", className)}>
      {children}
    </a>
  );
}
