'use client'

import { cn } from '@/lib/utils'

import type * as React from 'react'

/**
 * Renders a styled HTML label element.
 */
export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      htmlFor={props.htmlFor}
      aria-label={props['aria-label']}
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}
