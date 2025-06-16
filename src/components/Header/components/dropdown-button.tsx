import { LucideChevronDown } from "lucide-react";
import { Button, type ButtonProps } from "../../ui/button";

export const DropdownButton = (props: ButtonProps) => {
  const { children, ...rest } = props;
  return (
    <Button variant="outlineBrand" {...rest}>
      <span>Github</span>
      <LucideChevronDown />
    </Button>
  );
};
