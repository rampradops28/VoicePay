import { NextRequest, NextResponse } from 'next/server';
import { voiceCommandSuggestions } from '@/ai/flows/voice-command-suggestions';

export async function POST(req: NextRequest) {
  try {
    const { partialCommand } = await req.json();

    if (typeof partialCommand !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: partialCommand must be a string' },
        { status: 400 }
      );
    }
    
    if (partialCommand.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = await voiceCommandSuggestions({ partialCommand });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in suggestion flow:', error);
    // Don't expose internal errors to the client
    return NextResponse.json(
      { error: 'An error occurred while fetching suggestions.' },
      { status: 500 }
    );
  }
}
