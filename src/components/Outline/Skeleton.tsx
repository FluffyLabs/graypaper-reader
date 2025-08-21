import type { FC } from "react";
import { twMerge } from "tailwind-merge";
import type { TOutlineSingleSlim } from "./types";

export const outlineForSkeleton = [
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
] satisfies TOutlineSingleSlim[];

export const OutlineLinkSkeleton: FC<{ className: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        "h-4 w-24 bg-gray-300/85 dark:bg-[var(--brand-light)] dark:opacity-15 rounded-md animate-pulse",
        className,
      )}
    />
  );
};
