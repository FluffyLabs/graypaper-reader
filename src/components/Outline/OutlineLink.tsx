import type { AnchorHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export const OutlineLink = ({
  className,
  onClick,
  firstLevel,
  isActive,
  href,
  ref,
  number,
  title,
  ...restOfProps
}: {
  firstLevel: boolean;
  isActive?: boolean;
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
        isActive && "font-bold",
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
          <span className={twMerge("border-b dark:border-brand/50 border-brand-darkest/50", isActive && "dark:border-brand border-brand-darkest")}>{title}</span>
        </>
      )}
      {!firstLevel && (
        <>
          {number != null && (
            <>
              <span>{number}</span>&nbsp;
            </>
          )}
          <span className={twMerge("border-b dark:border-brand-light/50 border-brand-dark/50", isActive && "dark:border-brand-light border-brand-dark")}>{title}</span>
        </>
      )}
    </a>
  );
};
