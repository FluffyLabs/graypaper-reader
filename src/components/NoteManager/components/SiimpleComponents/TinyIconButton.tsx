import { Button, cn } from "@fluffylabs/shared-ui";
import type { ComponentProps } from "react";

export const TinyIconButton = (
  props: {
    icon: React.ReactNode;
    "aria-label": string;
    "data-testid"?: string;
  } & ComponentProps<typeof Button>,
) => {
  const { icon, "aria-label": ariaLabel, "data-testid": dataTestId, className, ...restOfProps } = props;

  return (
    <Button
      variant="ghost"
      intent="neutralMedium"
      className={cn("p-2 h-6 -top-0.5 relative", className)}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      {...restOfProps}
    >
      {icon}
    </Button>
  );
};
