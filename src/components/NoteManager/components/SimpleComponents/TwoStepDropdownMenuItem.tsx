import { DropdownMenuItem, cn } from "@fluffylabs/shared-ui";
import { type MouseEventHandler, type PropsWithChildren, type ReactNode, useEffect, useRef, useState } from "react";

export const TwoStepDropdownMenuItem = ({
  children,
  confirmationSlot,
  onClick,
}: PropsWithChildren<{ confirmationSlot: ReactNode; onClick: MouseEventHandler<HTMLDivElement> }>) => {
  const [isConfirmation, setIsConfirmation] = useBooleanStateWithAutoRevertToFalse({ delayInMs: 2000 });

  const handleOnClick: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isConfirmation) {
      e.preventDefault();
      e.stopPropagation();
      setIsConfirmation(true);
    } else {
      onClick(e);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleOnClick}
      className={cn(isConfirmation ? "text-destructive hover:bg-destructive/20 hover:text-destructive" : "")}
    >
      {!isConfirmation && children}
      {isConfirmation && confirmationSlot}
    </DropdownMenuItem>
  );
};

function useBooleanStateWithAutoRevertToFalse({ delayInMs }: { delayInMs: number }) {
  const [state, setState] = useState(false);
  const delayInMsRef = useRef(delayInMs);
  delayInMsRef.current = delayInMs;

  useEffect(() => {
    if (!state) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setState(false);
    }, delayInMsRef.current);

    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [state]);

  return [state, setState] as const;
}
