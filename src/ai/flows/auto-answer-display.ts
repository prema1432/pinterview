'use server';
/**
 * @fileOverview A conversational AI agent for interview assistance.
 *
 * - streamAnswer - A flow that provides real-time, context-aware answers to interview questions.
 */
import {ai} from '@/ai/genkit';
import type { CopilotInput } from '@/lib/schemas';

export async function streamAnswer(input: CopilotInput) {
    const promptParts: (string | {text: string})[] = [
      {
          text: `You are InterviewAce, an AI Interview Copilot designed to help candidates land their dream job. As an expert AI assistant and coding expert, you provide real-time, tailored answers during a job interview. Your answers should be concise, professional, and directly address the question. The user is in a live interview, so clarity and accuracy are paramount.

**If the question is a coding problem:**
1.  Provide a clear, commented code solution in Python. The code MUST be in a markdown code block with the language specified as 'python'.
2.  After the code, provide a "### How it Works:" section explaining the logic step-by-step in a numbered list.
3.  Then, add a "### Why this Approach:" section explaining the choice of data structures, algorithms, and overall strategy. Include the time and space complexity. Use bolding for sub-headings like **Clarity and Simplicity:**.

**If the question is behavioral or technical (non-coding):**
- Provide a direct, well-structured answer. Use the provided resume and conversation history to personalize your response and maintain context.

Avoid pleasantries and directly provide the answer.
`
      },
    ];

    if (input.resume) {
        promptParts.push({ text: `Here is the user's resume for context:\n---\n${input.resume}\n---` });
    }

    if (input.history && input.history.length > 0) {
        for (const message of input.history) {
            if (message.role === 'user') {
                promptParts.push({text: `Interviewer: ${message.content}`});
            } else {
                promptParts.push({text: `You: ${message.content}`});
            }
        }
    }
    
    promptParts.push({text: `The interviewer just asked:\n"${input.question}"\n\nYour answer:`});
    
    const {stream} = ai.generateStream({
        prompt: promptParts.map(p => (typeof p === 'string' ? { text: p } : p)),
    });
    
    return stream;
}
