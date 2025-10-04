'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing real-time voice command suggestions and guidance to users.
 *
 * The flow takes a partial voice command as input and returns suggestions for completing the command, ensuring it matches the expected syntax.
 *
 * @interface VoiceCommandSuggestionsInput - The input type for the voiceCommandSuggestions function.
 * @interface VoiceCommandSuggestionsOutput - The output type for the voiceCommandSuggestions function.
 * @function voiceCommandSuggestions - A function that handles the voice command suggestions process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceCommandSuggestionsInputSchema = z.object({
  partialCommand: z
    .string()
    .describe(
      'The partial voice command entered by the user. This should be a fragment of a command.'
    ),
});

export type VoiceCommandSuggestionsInput = z.infer<
  typeof VoiceCommandSuggestionsInputSchema
>;

const VoiceCommandSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'An array of suggested voice commands based on the partial command.  The suggestions should match the expected syntax for billing transactions, such as adding items, removing items, calculating totals, or resetting the bill.'
    ),
});

export type VoiceCommandSuggestionsOutput = z.infer<
  typeof VoiceCommandSuggestionsOutputSchema
>;

export async function voiceCommandSuggestions(
  input: VoiceCommandSuggestionsInput
): Promise<VoiceCommandSuggestionsOutput> {
  return voiceCommandSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceCommandSuggestionsPrompt',
  input: {schema: VoiceCommandSuggestionsInputSchema},
  output: {schema: VoiceCommandSuggestionsOutputSchema},
  prompt: `You are a helpful assistant that suggests valid voice commands for a billing application.

  The application supports the following command structures in English and Tamil:
  - Adding items: "add <item> <quantity><unit> <price>rs" (e.g., "add rice 2kg 120rs")
  - Removing items: "remove <item>" (e.g., "remove rice")
  - Calculating total: "calculate total" or "kanak"
  - Resetting bill: "reset bill"
  - Saving the bill: "save bill"

  Here are some Tamil examples:
  - Adding items: "சேர் அரிசி 2கிலோ 120ரூ" (sēr arisi 2kilo 120rs)
  - Removing items: "நீக்கு அரிசி" (nīkku arisi)
  - Calculating total: "மொத்தம்" (mottam) or "kanak"
  - Resetting bill: "பில்லை அழி" (billai aḻi)
  - Saving the bill: "பில்லை சேமி" (billai sēmi)


  Given the following partial command, suggest up to 5 valid commands that the user might want to use.

  Partial Command: {{{partialCommand}}}

  Ensure that suggestions are contextually relevant and follow the correct syntax. If the partial command is in Tamil, prefer Tamil suggestions. Return the suggestions as a JSON array of strings.
  `,
});

const voiceCommandSuggestionsFlow = ai.defineFlow(
  {
    name: 'voiceCommandSuggestionsFlow',
    inputSchema: VoiceCommandSuggestionsInputSchema,
    outputSchema: VoiceCommandSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
