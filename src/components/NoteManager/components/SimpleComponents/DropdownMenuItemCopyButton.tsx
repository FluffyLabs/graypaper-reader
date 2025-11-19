import { Button } from "@fluffylabs/shared-ui";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "../icons/CheckIcon";
import { CopyIcon } from "../icons/CopyIcon";

export const DropdownMenuItemCopyButton = ({ href, onCopyComplete }: { href: string; onCopyComplete: () => void }) => {
  const [secondaryState, setSecondaryState] = useState<"success" | "error" | undefined>(undefined);
  const onCopyCompleteRef = useRef(onCopyComplete);
  onCopyCompleteRef.current = onCopyComplete;

  useEffect(() => {
    if (!secondaryState) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setSecondaryState(undefined);
      onCopyCompleteRef.current?.();
    }, 2000);

    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [secondaryState]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Copy link to clipboard"
      disabled={secondaryState !== undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!secondaryState) {
          try {
            navigator.clipboard.writeText(`${window.location.origin}${href}`);
            setSecondaryState("success");
          } catch (error) {
            setSecondaryState("error");
            console.error("Failed to copy link:", error);
          }
        }
      }}
      className="py-3.5 px-3.5 my-[-8px]"
    >
      {!secondaryState && <CopyIcon />}
      {secondaryState === "success" && <CheckIcon />}
      {secondaryState === "error" && <span className="text-lg text-destructive">⚠</span>}
    </Button>
  );
};
