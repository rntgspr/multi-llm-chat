import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EntrarComConvite } from '@/components/features/salas/entrar-com-convite'

interface PaginaEntrarProps {
  params: Promise<{ codigo: string }>
}

export default async function PaginaEntrar({ params }: PaginaEntrarProps) {
  const sessao = await auth()
  const { codigo } = await params

  // Se não está logado, redireciona para login (que depois volta para cá)
  if (!sessao?.user) {
    redirect(`/login?callbackUrl=/entrar/${codigo}`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 bg-background">
      <EntrarComConvite codigo={codigo} />
    </main>
  )
}
