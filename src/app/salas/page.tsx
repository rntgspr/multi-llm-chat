import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ListaSalas } from '@/components/features/salas/lista-salas'
import { CabecalhoSalas } from '@/components/features/salas/cabecalho-salas'

export default async function PaginaSalas() {
  const sessao = await auth()

  if (!sessao?.user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <CabecalhoSalas usuario={sessao.user} />
      <div className="flex-1 container mx-auto p-6">
        <ListaSalas />
      </div>
    </main>
  )
}
