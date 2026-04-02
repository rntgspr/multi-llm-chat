'use server'

import { z } from 'zod'

const greetingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

export type GreetingState = {
  message: string | null
  error: string | null
}

export async function greetAction(_prev: GreetingState, formData: FormData): Promise<GreetingState> {
  const result = greetingSchema.safeParse({
    name: formData.get('name'),
  })

  if (!result.success) {
    return { message: null, error: result.error.issues[0].message }
  }

  return { message: `Hello, ${result.data.name}!`, error: null }
}
