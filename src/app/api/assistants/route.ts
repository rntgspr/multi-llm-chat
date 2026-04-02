import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  listAssistants,
  listOnlineAssistants,
} from '@/services/assistants/assistant-manager'

/**
 * GET /api/assistants - Lists all available assistants
 */
export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const onlineOnly = searchParams.get('online') === 'true'

  const assistants = onlineOnly ? listOnlineAssistants() : listAssistants()

  return NextResponse.json({ assistants })
}
