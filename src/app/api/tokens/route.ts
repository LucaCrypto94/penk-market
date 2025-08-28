import { NextResponse } from 'next/server';
import { getToTokens, getFromTokens, getAllTokens } from '@/lib/token-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get tokens from the utility functions
    const toTokens = getToTokens();
    const fromTokens = getFromTokens();
    const allTokens = getAllTokens();
    
    return NextResponse.json({ 
      success: true, 
      toTokens,
      fromTokens,
      allTokens,
      source: 'tokens.json via utility functions',
      totalTokens: allTokens.length
    });
    
  } catch (error) {
    console.error('Error reading tokens from utility functions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read tokens from utility functions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 