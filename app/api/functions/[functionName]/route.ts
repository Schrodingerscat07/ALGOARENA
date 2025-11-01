import { NextRequest, NextResponse } from 'next/server';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

// Proxy route to call Firebase Functions
// The client calls this route, which then calls the actual Firebase Function
export async function POST(
  request: NextRequest,
  { params }: { params: { functionName: string } }
) {
  try {
    const functionName = params.functionName;
    const body = await request.json();

    // Get Firebase Functions instance
    const functions = getFunctions(app);
    const callable = httpsCallable(functions, functionName);
    
    // Call the Firebase Function
    const result = await callable(body);
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Function call error:', error);
    return NextResponse.json(
      { error: error.message || 'Function call failed' },
      { status: 500 }
    );
  }
}

