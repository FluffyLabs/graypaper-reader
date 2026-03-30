import "./Outline.css";
import { type FC, memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { type ILocationContext, LocationContext } from "../LocationProvider/LocationProvider";
import type { IPdfContext } from "../PdfProvider/PdfProvider";
import { PdfContext } from "../PdfProvider/PdfProvider";
import { OutlineLink } from "./OutlineLink";
import { OutlineLinkSkeleton, outlineForSkeleton } from "./Skeleton";
import type { TOutlineComplete, TOutlineSingleSlim } from "./types";
import { useActiveOutlineItem } from "./useActiveOutlineItem";

export function Outline({ searchIsDone, className }: { searchIsDone: boolean; className?: string }) {
  const { locationParams } = useContext(LocationContext) as ILocationContext;
  const { pdfDocument, linkService, viewer, pageOffsets } = useContext(PdfContext) as IPdfContext;
  const [outline, setOutline] = useState<TOutlineComplete | undefined>(undefined);

  useEffect(() => {
    pdfDocument?.getOutline().then((outline) => setOutline(outline));
  }, [pdfDocument]);

  const activePath = useActiveOutlineItem(outline, pdfDocument, viewer?.container, pageOffsets);

  const section = locationParams.section?.toLowerCase();

  useEffect(() => {
    if (section === undefined || searchIsDone === false) {
      return;
    }
    const findItem = (outline: TOutlineComplete): TOutlineComplete[0] | undefined => {
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
    (dest: TOutlineSingleSlim["dest"]) => {
      if (!dest) return;
      linkService?.goToDestination(dest);
    },
    [linkService],
  );

  return <OutlineDumb outline={outline} onClick={handleClick} activePath={activePath} className={className} />;
}

const OutlineDumb: FC<{
  outline?: TOutlineSingleSlim[];
  onClick: (item: TOutlineSingleSlim["dest"]) => void;
  activePath: string | null;
  className?: string;
}> = memo(({ outline, onClick, activePath, className }) => {
  const activeRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePath || !activeRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const el = activeRef.current;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const isVisible = elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom;
    if (!isVisible) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activePath]);

  const renderOutline = (
    outline: TOutlineSingleSlim[],
    options: { firstLevel?: boolean; isSkeleton?: boolean; parentPath?: string } = {},
  ) => {
    const { firstLevel = false, isSkeleton = false, parentPath = "" } = options;

    return (
      <ul className={twMerge(firstLevel ? "mt-0" : "my-3", className)}>
        {outline.map((item, index) => {
          const path = parentPath ? `${parentPath}.${index}` : `${index}`;
          const { title, number } = splitOutlineTitle(item.title);
          const isActive = activePath === path;
          return (
            <li key={path} className={firstLevel ? "pl-0 mt-4 first-of-type:mt-0" : "pl-4 mt-0.5 first-of-type:mt-0"}>
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
                <OutlineLink
                  ref={isActive ? activeRef : undefined}
                  href={"#"}
                  firstLevel={firstLevel}
                  isActive={isActive}
                  onClick={(e) => {
                    e.preventDefault();
                    onClick(item.dest);
                  }}
                  title={title}
                  number={firstLevel ? number?.replace(".", " >") : (number ?? undefined)}
                />
              )}
              {item.items.length > 0 ? renderOutline(item.items, { isSkeleton, parentPath: path }) : null}
            </li>
          );
        })}
      </ul>
    );
  };

  const pickedOutline = outline ?? outlineForSkeleton;

  return (
    <div
      ref={containerRef}
      className="rounded-lg min-h-0 w-full py-6 px-6 bg-[#eeeeee] dark:bg-[#323232] overflow-y-auto"
    >
      {renderOutline(pickedOutline, { firstLevel: true, isSkeleton: pickedOutline === outlineForSkeleton })}
    </div>
  );
});

OutlineDumb.displayName = "OutlineDumb";

function splitOutlineTitle(title: string): { number: string | null; title: string } {
  const regex = /^((?:\d+(?:\.\d+)?|Appendix [A-Z]|[A-Z]\.\d+)\.)\s*(.+)$/;
  const match = title.match(regex);

  if (match) {
    return {
      number: match[1],
      title: match[2],
    };
  }

  return {
    number: null,
    title: title,
  };
}
