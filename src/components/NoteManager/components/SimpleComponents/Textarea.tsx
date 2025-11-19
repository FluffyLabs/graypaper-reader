import { Textarea } from "@fluffylabs/shared-ui";
import { cn } from "@fluffylabs/shared-ui";
import type { ComponentProps } from "react";
import { inputClassNames } from "./common";

export const NoteSimpleTextarea = (props: ComponentProps<typeof Textarea>) => {
  const { className, ...restOfProps } = props;

  return <Textarea {...restOfProps} className={cn(inputClassNames, className)} />;
};
