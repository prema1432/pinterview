'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating practice interview questions.
 *
 * The flow takes a role and/or company as input and generates a list of relevant interview questions.
 * It exports:
 *   - `generateInterviewQuestions`: The function to call to generate the questions.
 *   - `InterviewQuestionGeneratorInput`: The input type for the function.
 *   - `InterviewQuestionGeneratorOutput`: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewQuestionGeneratorInputSchema = z.object({
  role: z.string().describe('The role the user is interviewing for.'),
  company: z.string().optional().describe('The company the user is interviewing with.'),
});
export type InterviewQuestionGeneratorInput = z.infer<
  typeof InterviewQuestionGeneratorInputSchema
>;

const InterviewQuestionGeneratorOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('An array of practice interview questions.'),
});
export type InterviewQuestionGeneratorOutput = z.infer<
  typeof InterviewQuestionGeneratorOutputSchema
>;

export async function generateInterviewQuestions(
  input: InterviewQuestionGeneratorInput
): Promise<InterviewQuestionGeneratorOutput> {
  return interviewQuestionGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interviewQuestionGeneratorPrompt',
  input: {schema: InterviewQuestionGeneratorInputSchema},
  output: {schema: InterviewQuestionGeneratorOutputSchema},
  prompt: `You are an expert interview question generator. You will generate a list of practice interview questions for the user to prepare with.

The user is interviewing for the role of {{role}}.

{{~#if company}}
The user is interviewing with the company {{company}}.
{{~/if}}

Generate a list of 5-10 practice interview questions that are relevant to the role and company.

Return the questions as an array of strings.

Here's an example of the desired format:

{
  "questions": [
    "Tell me about yourself.",
    "Why are you interested in this role?",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for this company?"
  ]
}
`,
});

const interviewQuestionGeneratorFlow = ai.defineFlow(
  {
    name: 'interviewQuestionGeneratorFlow',
    inputSchema: InterviewQuestionGeneratorInputSchema,
    outputSchema: InterviewQuestionGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
