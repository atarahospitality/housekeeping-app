import { NextResponse, type NextRequest } from 'next/server'

// Auth disabled — no login required.
// Original auth logic preserved in git history; restore if needed.
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
