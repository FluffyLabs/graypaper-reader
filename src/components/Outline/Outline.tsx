import "./Outline.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { type FC, type ReactNode, memo, useCallback, useContext, useEffect, useState } from "react";
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

    const itemToScrollTo = !outline ? undefined : findItem(outline);
    if (itemToScrollTo?.dest) {
      linkService?.goToDestination(itemToScrollTo.dest);
    }
  }, [searchIsDone, section, outline, linkService]);

  const handleClick = useCallback(
    (dest: TOutline[0]["dest"]) => {
      if (!dest) return;
      linkService?.goToDestination(dest);
    },
    [linkService],
  );

  return <OutlineDumb outline={outline} onClick={handleClick} />;
}

type IOutline = Pick<TOutline[0], "title" | "dest" | "items">;

const outlineForSkeleton = [
  ...Array(12)
    .fill(0)
    .map((_, index) => ({
      title: `Skeleton Title ${index + 1}`,
      dest: "skeleton-destination",
      items: [
        ...Array(5)
          .fill(0)
          .map((_, index) => ({
            title: `Skeleton Subitem ${index + 1}`,
            dest: "skeleton-subitem-destination",
            items: [],
          })),
      ],
    })),
] satisfies IOutline[];

const OutlineDumb: FC<{ outline?: IOutline[]; onClick: (item: TOutline[0]["dest"]) => void }> = memo(
  ({ outline, onClick }) => {
    const renderOutline = (outline: IOutline[], options: { firstLevel?: boolean; isSkeleton?: boolean } = {}) => {
      const { firstLevel = false, isSkeleton = false } = options;

      return (
        <ul className={twMerge(firstLevel ? "mt-0" : "my-3")}>
          {outline.map((item, index) => (
            <li key={item.title} className={twMerge(firstLevel ? "pl-0 mt-4" : "pl-4", "mt-0.5 first-of-type:mt-0")}>
              {isSkeleton && (
                <OutlineLinkSkeleton
                  className={twMerge(
                    "h-4.5",
                    index % 4 === 0 && "w-52",
                    index % 4 === 1 && "w-64",
                    index % 4 === 2 && "w-48",
                    index % 4 === 3 && "w-24",
                    !firstLevel && "mt-0.5",
                    "max-w-10/12",
                  )}
                />
              )}
              {!isSkeleton && (
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
              )}
              {item.items.length > 0 ? renderOutline(item.items, { isSkeleton }) : null}
            </li>
          ))}
        </ul>
      );
    };

    const pickedOutline = outline ?? outlineForSkeleton;

    return (
      <div className="rounded-lg min-h-0 w-full py-6 px-6  bg-[#eeeeee] dark:bg-[#323232]  overflow-y-auto">
        {renderOutline(pickedOutline, { firstLevel: true, isSkeleton: pickedOutline === outlineForSkeleton })}
      </div>
    );
  },
);

OutlineDumb.displayName = "OutlineDumb";

type ILinkProps = {
  dest: TOutline[0]["dest"];
  children: ReactNode;
  onClick: (dest: TOutline[0]["dest"]) => void;
  className?: string;
};

function Link({ dest, children, className, onClick }: ILinkProps) {
  return (
    <a onClick={() => dest && onClick(dest)} className={twMerge("cursor-pointer hover:opacity-75", className)}>
      {children}
    </a>
  );
}

const OutlineLinkSkeleton: FC<{ className: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "h-4 w-24 bg-gray-300/85 dark:bg-[var(--brand-light)] dark:opacity-15 rounded-md animate-pulse",
        className,
      )}
    />
  );
};
