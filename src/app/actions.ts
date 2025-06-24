'use server';

import { createStreamableValue } from 'ai/rsc';
import { streamAnswer } from '@/ai/flows/auto-answer-display';
import { generateInterviewQuestions, type InterviewQuestionGeneratorInput, type InterviewQuestionGeneratorOutput } from '@/ai/flows/interview-question-generator';
import { extractQuestionFromScreen, type ScreenQuestionExtractorInput, type ScreenQuestionExtractorOutput } from '@/ai/flows/screen-question-extractor';
import { generateSpeech, type TextToSpeechOutput } from '@/ai/flows/text-to-speech';
<<<<<<< HEAD
import { optimizeResume, type ResumeOptimizerInput, type ResumeOptimizerOutput } from '@/ai/flows/resume-optimizer-flow';
import { questionsSchema, screenExtractorSchema, CopilotInputSchema, resumeOptimizerSchema, type CopilotInput } from '@/lib/schemas';
=======
import { optimizeResume, type ResumeOptimizerInput, type ResumeOptimizerOutput } from '@/ai/flows/resume-optimizer';
import { questionsSchema, screenExtractorSchema, CopilotInputSchema, type CopilotInput, resumeOptimizerSchema } from '@/lib/schemas';
>>>>>>> 80d1fa48581b116983731692f852547adcf46921


export async function getStreamingAnswer(values: CopilotInput) {
  const stream = createStreamableValue('');
  const validatedInput = CopilotInputSchema.safeParse(values);
  
  if (!validatedInput.success) {
    const error = validatedInput.error.format()._errors.join('\n');
    console.error("Validation Error:", error);
    stream.done();
    return { output: stream.value, error };
  }

  (async () => {
    try {
        const answerStream = await streamAnswer(validatedInput.data);
        for await (const chunk of answerStream) {
            stream.update(chunk.text);
        }
    } catch (e: any) {
        console.error("Streaming error:", e);
        stream.done({ error: 'An unexpected error occurred during streaming.' });
    } finally {
        stream.done();
    }
  })();

  return { output: stream.value, error: null };
}

export async function getPracticeQuestions(values: InterviewQuestionGeneratorInput): Promise<InterviewQuestionGeneratorOutput> {
    const validatedInput = questionsSchema.safeParse(values);
    if (!validatedInput.success) {
        throw new Error('Invalid input.');
    }
    return await generateInterviewQuestions(validatedInput.data);
}

export async function getQuestionFromScreen(values: ScreenQuestionExtractorInput): Promise<ScreenQuestionExtractorOutput> {
    const validatedInput = screenExtractorSchema.safeParse(values);
    if (!validatedInput.success) {
        throw new Error('Invalid input.');
    }
    return await extractQuestionFromScreen(validatedInput.data);
}

export async function getSpokenAnswer(text: string): Promise<TextToSpeechOutput> {
    if (!text) {
        throw new Error('Input text cannot be empty.');
    }
    return await generateSpeech(text);
}

export async function getOptimizedResume(values: ResumeOptimizerInput): Promise<ResumeOptimizerOutput> {
    const validatedInput = resumeOptimizerSchema.safeParse(values);
    if (!validatedInput.success) {
<<<<<<< HEAD
        throw new Error('Invalid input for resume optimizer.');
=======
        const errorMessage = validatedInput.error.format()._errors.join(' ');
        throw new Error(errorMessage || 'Invalid input.');
>>>>>>> 80d1fa48581b116983731692f852547adcf46921
    }
    return await optimizeResume(validatedInput.data);
}
