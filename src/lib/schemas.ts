import { z } from 'zod';

export const questionsSchema = z.object({
  role: z.string().min(2, { message: 'Role is required and must be at least 2 characters.' }),
  company: z.string().optional(),
});

export const screenExtractorSchema = z.object({
  photoDataUri: z.string().min(1, {message: 'A screen capture is required.'}),
});

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const CopilotInputSchema = z.object({
  question: z.string().describe('The latest interview question asked by the interviewer.'),
  resume: z.string().optional().describe("The user's resume or CV content."),
  history: z.array(MessageSchema).optional().describe('The history of the conversation so far.'),
});

export type CopilotInput = z.infer<typeof CopilotInputSchema>;

export const resumeOptimizerSchema = z.object({
  resumeContent: z.string().min(1, { message: 'A resume must be selected or its content provided.' }),
  jobDescription: z.string().min(20, { message: 'Job description must be at least 20 characters.' }),
});
