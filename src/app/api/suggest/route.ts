
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
    
    // Do not call the flow for very short commands to save resources and avoid errors.
    if (partialCommand.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = await voiceCommandSuggestions({ partialCommand });
    
    // Ensure result is in the correct format before sending
    if (result && Array.isArray(result.suggestions)) {
      return NextResponse.json(result);
    }
    
    // If result is not as expected for any reason, return empty suggestions
    return NextResponse.json({ suggestions: [] });

  } catch (error) {
    console.error('Error in suggestion flow:', error);
    // CRITICAL: Always return a valid JSON response, even on internal errors.
    // This prevents the client from crashing.
    return NextResponse.json(
      { suggestions: [], error: 'An error occurred while fetching suggestions.' },
      { status: 200 } // Return 200 OK even on error to not crash the client fetch.
    );
  }
}
