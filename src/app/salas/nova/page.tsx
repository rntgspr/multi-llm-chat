import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FormularioNovaSala } from '@/components/features/salas/formulario-nova-sala'

export default async function PaginaNovaSala() {
  const sessao = await auth()

  if (!sessao?.user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto p-4">
          <h1 className="text-xl font-bold text-foreground">Criar Nova Sala</h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-6 max-w-2xl">
        <FormularioNovaSala />
      </div>
    </main>
  )
}
