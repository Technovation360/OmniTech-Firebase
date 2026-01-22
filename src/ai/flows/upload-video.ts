'use server';
/**
 * @fileOverview A server-side flow to get a pre-signed URL for uploading a video to Backblaze B2.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import B2 from 'backblaze-b2';

const GetB2UploadUrlOutputSchema = z.object({
  uploadUrl: z.string(),
  authorizationToken: z.string(),
  downloadUrl: z.string(), // Base URL for downloads
});

export type GetB2UploadUrlOutput = z.infer<typeof GetB2UploadUrlOutputSchema>;

// Ensure B2 credentials are set in environment variables
if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_ID) {
  if (process.env.NODE_ENV === 'production') {
    console.error('Backblaze B2 credentials are not configured.');
  } else {
    console.warn('Backblaze B2 credentials are not configured. Uploads will be mocked.');
  }
}

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || 'mock-key-id',
  applicationKey: process.env.B2_APPLICATION_KEY || 'mock-key',
});


export async function getB2UploadUrl(): Promise<GetB2UploadUrlOutput> {
  return getB2UploadUrlFlow();
}


const getB2UploadUrlFlow = ai.defineFlow(
  {
    name: 'getB2UploadUrlFlow',
    inputSchema: z.void(), // No input needed
    outputSchema: GetB2UploadUrlOutputSchema,
  },
  async () => {
    if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_ID) {
        console.log('Mocking B2 getUploadUrl since credentials are not set.');
        // Return a placeholder URL for development without credentials
        return { 
            uploadUrl: `https://mock-upload-url.com/b2api/v2/b2_upload_file`,
            authorizationToken: 'mock-auth-token',
            downloadUrl: 'https://f005.backblazeb2.com', // mock download url
        };
    }
    
    const { data: authData } = await b2.authorize();
    const { downloadUrl } = authData;

    const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID!,
    });

    return { uploadUrl, authorizationToken, downloadUrl };
  }
);
