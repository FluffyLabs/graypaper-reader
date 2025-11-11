import { Textarea } from '@fluffylabs/shared-ui';
import { ComponentProps } from 'react';
import { cn } from '@fluffylabs/shared-ui';
import { inputClassNames } from './common';

export const NoteSimpleTextarea = (props: ComponentProps<typeof Textarea>) => {
  const { className, ...restOfProps } = props;

  return (
    <Textarea
      {...restOfProps}
      className={cn(inputClassNames, className)}
    />
  );
};
