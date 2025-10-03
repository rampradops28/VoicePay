'use server';

/**
 * @fileOverview This file defines a Genkit flow for simulating voice verification.
 *
 * In a real application, this flow would send audio data to a backend service
 * that performs voice biometrics to verify the speaker's identity. This simulation
 * uses a Genkit prompt to decide if the verification is successful based on keywords.
 *
 * @interface VerifyVoiceInput - The input type for the verifyVoice function.
 * @interface VerifyVoiceOutput - The output type for the verifyVoice function.
 * @function verifyVoice - A function that simulates the voice verification process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyVoiceInputSchema = z.object({
  ownerName: z.string().describe('The name of the user to verify.'),
  command: z
    .string()
    .describe('The voice command spoken by the user.'),
  audioDataUri: z
    .string()
    .describe(
      "A chunk of audio as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type VerifyVoiceInput = z.infer<typeof VerifyVoiceInputSchema>;

const VerifyVoiceOutputSchema = z.object({
  isVerified: z
    .boolean()
    .describe(
      'Whether the voice was successfully verified against the enrolled voiceprint for the owner.'
    ),
});

export type VerifyVoiceOutput = z.infer<typeof VerifyVoiceOutputSchema>;

export async function verifyVoice(
  input: VerifyVoiceInput
): Promise<VerifyVoiceOutput> {
  return verifyVoiceFlow(input);
}

const verifyPrompt = ai.definePrompt({
    name: 'verifyVoicePrompt',
    input: { schema: VerifyVoiceInputSchema },
    output: { schema: VerifyVoiceOutputSchema },
    prompt: `You are a voice verification security system. Your job is to determine if the speaker is an impostor.

    For this simulation, you will check the spoken command for the keyword "impostor".

    - If the command contains the word "impostor", the speaker is an impostor. Return isVerified: false.
    - Otherwise, the speaker is the legitimate owner, {{ownerName}}. Return isVerified: true.
    
    Spoken Command: "{{command}}"
    `,
});


const verifyVoiceFlow = ai.defineFlow(
  {
    name: 'verifyVoiceFlow',
    inputSchema: VerifyVoiceInputSchema,
    outputSchema: VerifyVoiceOutputSchema,
  },
  async (input) => {
    // In a real implementation, you would send the audioDataUri to a secure backend.
    // That backend would use a library like 'librosa' in Python to extract MFCCs
    // and compare them against a stored voiceprint in a database like Firestore.

    // This simulation uses a Genkit prompt to check for the "impostor" keyword.
    const { output } = await verifyPrompt(input);
    
    if (!output) {
      // Fallback in case the prompt fails
      return { isVerified: false };
    }

    return output;
  }
);
