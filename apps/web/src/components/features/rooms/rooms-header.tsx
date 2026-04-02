'use client'

import { LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface RoomsHeaderProps {
  user: User
}

export function RoomsHeader({ user }: RoomsHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/rooms" className="text-xl font-bold text-foreground">
            Multi LLM Chat
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/rooms/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Room
          </Link>

          <div className="flex items-center gap-3">
            {user.image && <img src={user.image} alt={user.name || 'Avatar'} className="h-8 w-8 rounded-full" />}
            <span className="text-sm text-foreground hidden sm:block">{user.name || user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
