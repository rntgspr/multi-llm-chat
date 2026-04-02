import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NewRoomForm } from '@/components/features/rooms/new-room-form'

export default async function NewRoomPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto p-4">
          <h1 className="text-xl font-bold text-foreground">Create New Room</h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-6 max-w-2xl">
        <NewRoomForm />
      </div>
    </main>
  )
}
