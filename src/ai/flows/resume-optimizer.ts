'use server';
/**
 * @fileOverview An AI agent that optimizes a resume for a specific job description.
 *
 * - optimizeResume - A function that handles the resume optimization process.
 * - ResumeOptimizerInput - The input type for the optimizeResume function.
 * - ResumeOptimizerOutput - The return type for the optimizeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResumeOptimizerInputSchema = z.object({
  resumeContent: z.string().describe("The content of the user's current resume."),
  jobDescription: z.string().describe('The job description the user is applying for.'),
});
export type ResumeOptimizerInput = z.infer<typeof ResumeOptimizerInputSchema>;

const ResumeOptimizerOutputSchema = z.object({
  optimizedResume: z.string().describe('The full content of the optimized resume.'),
});
export type ResumeOptimizerOutput = z.infer<typeof ResumeOptimizerOutputSchema>;

export async function optimizeResume(input: ResumeOptimizerInput): Promise<ResumeOptimizerOutput> {
  return resumeOptimizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeOptimizerPrompt',
  input: {schema: ResumeOptimizerInputSchema},
  output: {schema: ResumeOptimizerOutputSchema},
  prompt: `You are an expert career coach and resume writer. Your task is to analyze the provided resume and job description, then rewrite the resume to be perfectly tailored for the role.

**Instructions:**
1.  **Analyze the Job Description:** Identify the key skills, qualifications, and responsibilities required for the role.
2.  **Analyze the Resume:** Understand the candidate's experience, skills, and accomplishments.
3.  **Optimize the Resume:**
    *   Rewrite the professional summary to directly address the job requirements.
    *   Rephrase bullet points under each work experience to use action verbs and quantify achievements that align with the job description.
    *   Highlight the most relevant skills from the resume in the "Skills" section.
    *   Ensure the tone is professional and confident.
4.  **Output:** Return the complete, optimized resume as a single string of text. Do not add any commentary or explanation outside of the resume content itself. The output should be ready to be copied and pasted into a document.

**Job Description:**
---
{{{jobDescription}}}
---

**Current Resume:**
---
{{{resumeContent}}}
---

**Optimized Resume:**
`,
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
