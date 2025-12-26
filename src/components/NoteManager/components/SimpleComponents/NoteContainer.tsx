import { cn } from "@fluffylabs/shared-ui";
import type { DetailedHTMLProps, HTMLProps, PropsWithChildren } from "react";

export type Props = PropsWithChildren<
  {
    active?: boolean;
  } & DetailedHTMLProps<HTMLProps<HTMLDivElement>, HTMLDivElement>
>;

export const NoteContainer = ({ children, active, className, ...restofProps }: Props) => {
  return (
    <div
      className={cn(
        "note rounded-xl p-4 relative",
        active && "bg-[var(--active-note-bg)] shadow-[0px_4px_0px_1px_var(--active-note-shadow-bg)] mb-1",
        !active && "bg-[var(--inactive-note-bg)] cursor-pointer",
        className,
      )}
      {...restofProps}
    >
      {children}
    </div>
  );
};
