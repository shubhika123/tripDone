import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate backend processing and saving search query history
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, message: 'Search saved successfully', data: body });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid search data' }, { status: 400 });
  }
}
