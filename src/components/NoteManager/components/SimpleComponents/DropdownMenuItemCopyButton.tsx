import { Button } from "@fluffylabs/shared-ui";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "../icons/CheckIcon";
import { CopyIcon } from "../icons/CopyIcon";

export const DropdownMenuItemCopyButton = ({ href, onCopyComplete }: { href: string; onCopyComplete: () => void }) => {
  const [isDelayedAlert, setIsDelayedAlert] = useState(false);
  const onCopyCompleteRef = useRef(onCopyComplete);
  onCopyCompleteRef.current = onCopyComplete;

  useEffect(() => {
    if (!isDelayedAlert) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setIsDelayedAlert(false);
      onCopyCompleteRef.current?.();
    }, 2000);

    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [isDelayedAlert]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Copy link to clipboard"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDelayedAlert) {
          setIsDelayedAlert(true);
          navigator.clipboard.writeText(`${window.location.origin}${href}`);
        }
      }}
      className="py-3.5 px-3.5 my-[-8px]"
    >
      {isDelayedAlert ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};
