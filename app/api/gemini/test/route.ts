import { NextRequest, NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 401 });
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-2.5-flash',
      maxOutputTokens: 2048,
    });

    const result = await model.invoke('Say hello');
    
    return NextResponse.json({
      success: true,
      response: result.text,
      modelInfo: {
        model: 'gemini-2.5-flash',
        configured: true
      }
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      error: 'API test failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}