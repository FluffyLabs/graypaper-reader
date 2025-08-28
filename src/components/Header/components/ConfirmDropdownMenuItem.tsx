import { DropdownMenuItem } from "@fluffylabs/shared-ui";
import { type ComponentProps, type PropsWithChildren, useEffect, useState } from "react";

type Props = ComponentProps<typeof DropdownMenuItem> & {
  onClick: () => void;
  confirmChildren: ComponentProps<typeof DropdownMenuItem>["children"];
};

export const ConfirmDropdownMenuItem = ({
  onClick,
  children,
  confirmChildren,
  ...restOfProps
}: PropsWithChildren<Props>) => {
  const [buttonState, setButtonState] = useState<"idle" | "waiting" | "confirming">("idle");
  const [waitingCount, setWaitingCount] = useState(0);

  const handleClick = () => {
    if (buttonState === "idle") {
      setButtonState("waiting");
    }
    if (buttonState === "confirming") {
      onClick();
      setButtonState("idle");
    }
  };

  useEffect(() => {
    if (buttonState === "waiting") {
      setWaitingCount(3);
      const timer = setInterval(() => {
        setWaitingCount((prevCount) => {
          if (prevCount === 0) {
            setButtonState("confirming");
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (buttonState === "confirming") {
      const timer = setTimeout(() => {
        setButtonState("idle");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [buttonState]);

  const handleSelect = (e: Event) => {
    if (buttonState !== "confirming") {
      e.preventDefault();
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleClick}
      onSelect={handleSelect}
      {...restOfProps}
      disabled={buttonState === "waiting"}
    >
      {buttonState === "idle" && children}
      {buttonState === "waiting" && <span>Please wait {waitingCount}s ...</span>}
      {buttonState === "confirming" && confirmChildren}
    </DropdownMenuItem>
  );
};
