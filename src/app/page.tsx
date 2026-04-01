import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const sessao = await auth()

  if (sessao?.user) {
    redirect('/salas')
  } else {
    redirect('/login')
  }
}
