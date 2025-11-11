import { Input } from '@fluffylabs/shared-ui';
import { ComponentProps } from 'react';
import { cn } from '@fluffylabs/shared-ui';
import { inputClassNames } from './common';

export const NoteSimpleInput = (props: ComponentProps<typeof Input>) => {
  const { className, ...restOfProps } = props;

  return (
    <Input
      {...restOfProps}
      className={cn(inputClassNames, className)}
    />
  );
}
