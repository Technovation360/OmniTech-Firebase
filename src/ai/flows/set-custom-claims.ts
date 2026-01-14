'use server';
/**
 * @fileOverview A server-side flow to set custom claims on a Firebase user.
 * This is a secure operation that should only be performed from a trusted environment.
 *
 * - setCustomClaim - A function to set a role claim for a given user UID.
 * - SetCustomClaimInput - The input type for the setCustomClaim function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

const SetCustomClaimInputSchema = z.object({
  uid: z.string().describe('The user\'s unique ID from Firebase Authentication.'),
  role: z.string().describe('The role to assign to the user (e.g., "central-admin", "doctor").'),
});

export type SetCustomClaimInput = z.infer<typeof SetCustomClaimInputSchema>;

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    // In a real production environment, you would use environment variables
    // or Google Application Default Credentials.
    // For local development with `genkit:watch`, this will re-use the initialized app.
    
    // Check for explicit service account credentials in environment variables
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback for environments where Application Default Credentials are set up
        // (e.g., Google Cloud Run, Cloud Functions)
         admin.initializeApp();
    }
}


export async function setCustomClaim(input: SetCustomClaimInput): Promise<{ success: boolean; message: string; }> {
  return setCustomClaimFlow(input);
}


const setCustomClaimFlow = ai.defineFlow(
  {
    name: 'setCustomClaimFlow',
    inputSchema: SetCustomClaimInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    try {
      await admin.auth().setCustomUserClaims(input.uid, { role: input.role });
      console.log(`Successfully set custom claim for user ${input.uid}: { role: '${input.role}' }`);
      return {
        success: true,
        message: `Custom claim set for user ${input.uid}.`,
      };
    } catch (error: any) {
      console.error('Error setting custom claim:', error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred while setting custom claim.',
      };
    }
  }
);
