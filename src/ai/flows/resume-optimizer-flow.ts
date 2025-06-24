'use server';
/**
 * @fileOverview An AI agent that optimizes a resume for a specific job description.
 *
 * - optimizeResume - A function that takes a resume and job description and returns an optimized resume.
 * - ResumeOptimizerInput - The input type for the optimizeResume function.
 * - ResumeOptimizerOutput - The return type for the optimizeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResumeOptimizerInputSchema = z.object({
  resumeContent: z
    .string()
    .describe('The full content of the user\'s current resume.'),
  jobDescription: z
    .string()
    .describe('The full job description for the target role.'),
});
export type ResumeOptimizerInput = z.infer<typeof ResumeOptimizerInputSchema>;

const ResumeOptimizerOutputSchema = z.object({
  optimizedResume: z
    .string()
    .describe('The optimized resume, formatted in Markdown.'),
});
export type ResumeOptimizerOutput = z.infer<
  typeof ResumeOptimizerOutputSchema
>;

export async function optimizeResume(
  input: ResumeOptimizerInput
): Promise<ResumeOptimizerOutput> {
  return resumeOptimizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeOptimizerPrompt',
  input: {schema: ResumeOptimizerInputSchema},
  output: {schema: ResumeOptimizerOutputSchema},
  prompt: `You are an expert career coach and resume writer. Your task is to rewrite the provided resume to be perfectly tailored for the given job description.

**Instructions:**
1.  **Analyze the Job Description:** Identify the key skills, qualifications, and keywords the employer is looking for.
2.  **Analyze the Resume:** Understand the candidate's experience, skills, and accomplishments.
3.  **Rewrite and Optimize:**
    *   Rephrase bullet points to use strong action verbs and quantify achievements wherever possible.
    *   Incorporate keywords from the job description naturally throughout the resume.
    *   Reorder or emphasize sections and experiences that are most relevant to the target role.
    *   Ensure the summary or objective statement (if present) is directly aligned with the job.
    *   Maintain a professional tone and a clean, readable format.
4.  **Return Format:** The entire optimized resume should be returned as a single string, formatted using Markdown for clarity and structure (e.g., using headings, bullet points).

**User's Resume:**
---
{{{resumeContent}}}
---

**Target Job Description:**
---
{{{jobDescription}}}
---

Return ONLY the full, optimized resume content in the specified JSON format.`,
});

const resumeOptimizerFlow = ai.defineFlow(
  {
    name: 'resumeOptimizerFlow',
    inputSchema: ResumeOptimizerInputSchema,
    outputSchema: ResumeOptimizerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
