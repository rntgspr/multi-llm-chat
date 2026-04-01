import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ChatContainer } from '@/components/features/chat/chat-container'

interface PaginaSalaProps {
  params: Promise<{ salaId: string }>
}

export default async function PaginaSala({ params }: PaginaSalaProps) {
  const sessao = await auth()
  const { salaId } = await params

  if (!sessao?.user) {
    redirect('/login')
  }

  return <ChatContainer salaId={salaId} usuario={sessao.user} />
}
