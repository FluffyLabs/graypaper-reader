import "./Outline.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { FC, memo, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import { PdfContext } from "../PdfProvider/PdfProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";

export type TOutline = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>;

export function Outline({ searchIsDone }: { searchIsDone: boolean }) {
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { pdfDocument, linkService } = useContext(PdfContext) as IPdfContext;
  const [outline, setOutline] = useState<TOutline | undefined>(undefined);

  useEffect(() => {
    pdfDocument?.getOutline().then((outline) => setOutline(outline));
  }, [pdfDocument]);

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

    const itemToScrollTo =  !outline ? undefined : findItem(outline);
    if (itemToScrollTo?.dest) {
      linkService?.goToDestination(itemToScrollTo.dest);
    }
  }, [searchIsDone, section, outline, linkService]);


  const handleClick = useCallback((dest: TOutline[0]['dest']) => {
    if (!dest) return;
    linkService?.goToDestination(dest);
  }, [linkService]);

  return (
    <OutlineDumb outline={outline} onClick={handleClick} />
  );
}

const OutlineDumb: FC<{outline?: TOutline, onClick: (item: TOutline[0]['dest']) => void}> = memo(({outline, onClick}) => {
  if (!outline) return <div>Loading...</div>;

  const renderOutline = (outline: TOutline, options: { firstLevel?: boolean } = {}) => {
    const { firstLevel = false } = options;

    return (
      <ul className={twMerge(firstLevel ? "mt-0" : "my-3")}>
        {outline.map((item) => (
          <li key={item.title} className={twMerge(firstLevel ? "pl-0 mt-4" : "pl-4", "mt-0.5 first-of-type:mt-0")}>
            <Link
              dest={item.dest}
              onClick={onClick}
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

  return (
    <div className="rounded-lg min-h-0 w-full py-6 px-6  bg-[#eeeeee] dark:bg-[#323232]  overflow-y-auto">
      {renderOutline(outline, { firstLevel: true })}
    </div>
  );
})

OutlineDumb.displayName = "OutlineDumb";

type ILinkProps = {
  dest: TOutline[0]["dest"];
  children: ReactNode;
  onClick: (dest: TOutline[0]["dest"]) => void;
  className?: string;
};

function Link({ dest, children, className, onClick }: ILinkProps) {
  return (
    <a onClick={()=> dest && onClick(dest)} className={twMerge("cursor-pointer hover:opacity-75", className)}>
      {children}
    </a>
  );
}
