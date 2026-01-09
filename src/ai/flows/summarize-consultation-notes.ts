'use server';

/**
 * @fileOverview Summarizes consultation notes using AI.
 *
 * - summarizeConsultationNotes - A function that handles the summarization of consultation notes.
 * - SummarizeConsultationNotesInput - The input type for the summarizeConsultationNotes function.
 * - SummarizeConsultationNotesOutput - The return type for the summarizeConsultationNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeConsultationNotesInputSchema = z.object({
  notes: z.string().describe('The consultation notes to summarize.'),
});
export type SummarizeConsultationNotesInput = z.infer<typeof SummarizeConsultationNotesInputSchema>;

const SummarizeConsultationNotesOutputSchema = z.object({
  summary: z.string().describe('The summary of the consultation notes.'),
});
export type SummarizeConsultationNotesOutput = z.infer<typeof SummarizeConsultationNotesOutputSchema>;

export async function summarizeConsultationNotes(
  input: SummarizeConsultationNotesInput
): Promise<SummarizeConsultationNotesOutput> {
  return summarizeConsultationNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConsultationNotesPrompt',
  input: {schema: SummarizeConsultationNotesInputSchema},
  output: {schema: SummarizeConsultationNotesOutputSchema},
  prompt: `You are an AI assistant helping doctors summarize consultation notes.

  Please summarize the following consultation notes:

  {{{notes}}}
  `,
});

const summarizeConsultationNotesFlow = ai.defineFlow(
  {
    name: 'summarizeConsultationNotesFlow',
    inputSchema: SummarizeConsultationNotesInputSchema,
    outputSchema: SummarizeConsultationNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
