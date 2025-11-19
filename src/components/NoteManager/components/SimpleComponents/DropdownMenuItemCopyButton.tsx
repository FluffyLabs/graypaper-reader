import { Button } from "@fluffylabs/shared-ui";
import { useEffect, useState } from "react";
import { CheckIcon } from "../icons/CheckIcon";
import { CopyIcon } from "../icons/CopyIcon";

export const DropdownMenuItemCopyButton = ({ href }: { href: string }) => {
  const [isDelayedAlert, setIsDelayedAlert] = useState(false);

  useEffect(() => {
    if (!isDelayedAlert) {
      return;
    }

    const timeoutHandle = setTimeout(() => {
      setIsDelayedAlert(false);
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        bubbles: true,
      });
      document.dispatchEvent(escapeEvent);
    }, 2000);

    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [isDelayedAlert]);

  return (
    <Button
      variant="ghost"
      size="icon"
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
