import { redirect } from 'next/navigation'

import { JoinWithInvite } from '@/components/features/rooms/join-with-invite'
import { auth } from '@/lib/auth'

interface JoinPageProps {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const session = await auth()
  const { code } = await params

  if (!session?.user) {
    redirect(`/login?callbackUrl=/join/${code}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 bg-background">
      <JoinWithInvite code={code} />
    </main>
  )
}
