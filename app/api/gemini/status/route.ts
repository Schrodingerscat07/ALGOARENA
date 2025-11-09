import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const status = {
      present: !!apiKey,
      valid: typeof apiKey === 'string' && apiKey.trim().length > 0,
      length: apiKey?.length || 0,
      isDefined: 'GOOGLE_API_KEY' in process.env,
      envKeys: Object.keys(process.env).filter(key => key.includes('API') || key.includes('KEY')),
    };
    
    // Do not log or return the key itself — only metadata about it
    return NextResponse.json(status);
  } catch (err: any) {
    console.error('Status route error:', err);
    return NextResponse.json({ 
      present: false, 
      error: err.message || String(err),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    }, { status: 500 });
  }
}
