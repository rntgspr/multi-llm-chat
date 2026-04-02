'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface JoinWithInviteProps {
  code: string
}

async function verifyInvite(code: string) {
  const response = await fetch(`/api/invites/${code}`)
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Invalid invite')
  }
  return response.json()
}

async function useInvite(code: string) {
  const response = await fetch(`/api/invites/${code}`, {
    method: 'POST',
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to use invite')
  }
  return response.json()
}

export function JoinWithInvite({ code }: JoinWithInviteProps) {
  const router = useRouter()

  const {
    data: inviteData,
    isLoading: verifying,
    error: verifyError,
  } = useQuery({
    queryKey: ['invite', code],
    queryFn: () => verifyInvite(code),
  })

  const mutation = useMutation({
    mutationFn: () => useInvite(code),
    onSuccess: (data) => {
      router.push(`/rooms/${data.room.id}`)
    },
  })

  useEffect(() => {
    if (inviteData?.valid && !mutation.isPending && !mutation.isSuccess && !mutation.isError) {
      mutation.mutate()
    }
  }, [inviteData, mutation])

  if (verifying) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Verifying invite...</h1>
      </div>
    )
  }

  if (verifyError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Invalid invite</h1>
        <p className="text-muted-foreground">
          {verifyError instanceof Error ? verifyError.message : 'The invite is not valid or has expired'}
        </p>
        <button
          onClick={() => router.push('/rooms')}
          className="mt-4 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Go to my rooms
        </button>
      </div>
    )
  }

  if (mutation.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Joining room...</h1>
      </div>
    )
  }

  if (mutation.isError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Error joining</h1>
        <p className="text-muted-foreground">
          {mutation.error instanceof Error ? mutation.error.message : 'Could not join the room'}
        </p>
        <button
          onClick={() => mutation.mutate()}
          className="mt-4 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h1 className="text-xl font-semibold text-foreground">Joining room...</h1>
      </div>
    )
  }

  return null
}
