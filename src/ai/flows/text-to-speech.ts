'use server';
/**
 * @fileOverview A Genkit flow for converting text to speech.
 *
 * - generateSpeech - Converts a string of text into an audio data URI.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("The generated audio as a data URI in WAV format. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});

export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function generateSpeech(text: string): Promise<TextToSpeechOutput> {
  return generateSpeechFlow(text);
}

const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: z.string(),
    outputSchema: TextToSpeechOutputSchema,
  },
  async (text) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text,
    });
    if (!media) {
      throw new Error('No media was returned from the text-to-speech model.');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);
    return {
      media: 'data:audio/wav;base64,' + wavData,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const buffers: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (chunk) => {
      buffers.push(chunk);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(buffers).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
