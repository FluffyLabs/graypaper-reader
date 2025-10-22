import type { AnchorHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const OutlineLink = ({
  className,
  onClick,
  firstLevel,
  href,
  ref,
  number,
  title,
  ...restOfProps
}: {
  firstLevel: boolean;
  number?: string;
  title: string;
  ref?: React.Ref<HTMLAnchorElement>;
} & AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      className={twMerge(
        "cursor-pointer hover:opacity-75",
        !firstLevel && "dark:text-brand-dark text-brand-dark mt-0.5",
        firstLevel && "dark:text-brand text-brand-very-dark",
        className,
      )}
      {...restOfProps}
    >
      {firstLevel && (
        <>
          {number != null && (
            <>
              <span>{number}</span>&nbsp;
            </>
          )}
          <span className="border-b-1 dark:border-brand/50 border-brand-darkest/50">{title}</span>
        </>
      )}
      {!firstLevel && (
        <>
          {number != null && (
            <>
              <span>{number}</span>&nbsp;
            </>
          )}
          <span className="border-b-1 dark:border-brand-light/50 border-brand-dark/50">{title}</span>
        </>
      )}
    </a>
  );
};
