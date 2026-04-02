import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RoomList } from '@/components/features/rooms/room-list'
import { RoomsHeader } from '@/components/features/rooms/rooms-header'

export default async function RoomsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <RoomsHeader user={session.user} />
      <div className="flex-1 container mx-auto p-6">
        <RoomList />
      </div>
    </main>
  )
}
