'use server';
/**
 * @fileOverview An AI agent that extracts interview questions from a screenshot.
 *
 * - extractQuestionFromScreen - A function that takes a screenshot and returns the interview question found.
 * - ScreenQuestionExtractorInput - The input type for the extractQuestionFromScreen function.
 * - ScreenQuestionExtractorOutput - The return type for the extractQuestionFromScreen function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScreenQuestionExtractorInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A screenshot of an interview screen, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScreenQuestionExtractorInput = z.infer<typeof ScreenQuestionExtractorInputSchema>;

const ScreenQuestionExtractorOutputSchema = z.object({
  question: z.string().describe('The interview question extracted from the screenshot.'),
});
export type ScreenQuestionExtractorOutput = z.infer<typeof ScreenQuestionExtractorOutputSchema>;

export async function extractQuestionFromScreen(input: ScreenQuestionExtractorInput): Promise<ScreenQuestionExtractorOutput> {
  return screenQuestionExtractorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'screenQuestionExtractorPrompt',
  input: {schema: ScreenQuestionExtractorInputSchema},
  output: {schema: ScreenQuestionExtractorOutputSchema},
  prompt: `You are an AI assistant that analyzes screenshots from job interviews.
Your task is to identify and extract the text of the interview question being displayed on the screen.
The question might be in a chat window, on a presentation slide, in a shared document, or part of a coding challenge.
If you cannot find a clear interview question in the image, return an empty string for the question.
Only return the question text itself.

Screenshot: {{media url=photoDataUri}}`,
});

const screenQuestionExtractorFlow = ai.defineFlow(
  {
    name: 'screenQuestionExtractorFlow',
    inputSchema: ScreenQuestionExtractorInputSchema,
    outputSchema: ScreenQuestionExtractorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
