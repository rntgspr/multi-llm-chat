import { redirect } from 'next/navigation'

import { ChatContainer } from '@/components/features/chat/chat-container'
import { auth } from '@/lib/auth'

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const session = await auth()
  const { roomId } = await params

  if (!session?.user) {
    redirect('/login')
  }

  return <ChatContainer roomId={roomId} user={session.user} />
}
