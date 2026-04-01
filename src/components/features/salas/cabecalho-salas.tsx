'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut, Plus } from 'lucide-react'

interface Usuario {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface CabecalhoSalasProps {
  usuario: Usuario
}

export function CabecalhoSalas({ usuario }: CabecalhoSalasProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/salas" className="text-xl font-bold text-foreground">
            Multi LLM Chat
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/salas/nova"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Sala
          </Link>

          <div className="flex items-center gap-3">
            {usuario.image && (
              <img
                src={usuario.image}
                alt={usuario.name || 'Avatar'}
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="text-sm text-foreground hidden sm:block">
              {usuario.name || usuario.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
