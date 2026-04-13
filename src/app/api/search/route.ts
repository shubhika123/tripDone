import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = 'https://tripdone-crl1.onrender.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const res = await fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Backend returned error', status: res.status },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend', message: error.message },
      { status: 502 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', proxy: true })
}
