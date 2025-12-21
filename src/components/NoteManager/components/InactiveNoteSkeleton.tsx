import { cn } from "@fluffylabs/shared-ui";
import { NoteContainer } from "./SimpleComponents/NoteContainer";

const skeletonLine = "rounded-md bg-gray-300/100 dark:bg-white/10";

export const InactiveNoteSkeleton = ({ className }: { className?: string }) => (
  <NoteContainer
    active={false}
    aria-hidden="true"
    className={cn(
      "note relative rounded-xl p-4 bg-[var(--inactive-note-bg)] border border-[var(--border)]/60 select-none animate-pulse",
      className,
    )}
  >
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={cn("h-4 w-9/12 rounded-md bg-brand-primary/50")} />
      </div>
      <div className="space-y-1">
        <div className={cn("h-4 w-full", skeletonLine)} />
        <div className={cn("h-4 w-11/12", skeletonLine)} />
        <div className={cn("h-4 w-8/12", skeletonLine)} />
      </div>
    </div>
  </NoteContainer>
);
