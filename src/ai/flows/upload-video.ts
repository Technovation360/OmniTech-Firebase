'use server';
/**
 * @fileOverview A server-side flow to get a pre-signed upload URL from Backblaze B2.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';

// No input needed from client as we are just requesting a URL
const UploadVideoInputSchema = z.object({});
export type UploadVideoInput = z.infer<typeof UploadVideoInputSchema>;

const UploadVideoOutputSchema = z.object({
  uploadUrl: z.string(),
  authorizationToken: z.string(),
  downloadHost: z.string(),
});
export type UploadVideoOutput = z.infer<typeof UploadVideoOutputSchema>;

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

export async function uploadVideo(input: UploadVideoInput): Promise<UploadVideoOutput> {
  return uploadVideoFlow(input);
}

const uploadVideoFlow = ai.defineFlow(
  {
    name: 'uploadVideoFlow',
    inputSchema: UploadVideoInputSchema,
    outputSchema: UploadVideoOutputSchema,
  },
  async () => {
    const bucketId = process.env.B2_BUCKET_ID;

    if (!bucketId) {
        // Mock response for local dev without credentials
        if(process.env.NODE_ENV !== 'production') {
            return {
               uploadUrl: 'https://mock-upload-url.com/api/v2/b2_upload_file',
               authorizationToken: 'mock-auth-token',
               downloadHost: 'f000.backblazeb2.com'
           }
        }
        throw new Error('B2_BUCKET_ID is not configured on the server.');
    }
    
    try {
        const { data: authData } = await b2.authorize(); 

        const { data: uploadData } = await b2.getUploadUrl({
            bucketId: bucketId,
        });
        
        return {
            uploadUrl: uploadData.uploadUrl,
            authorizationToken: uploadData.authorizationToken,
            downloadHost: authData.downloadUrl,
        };

    } catch (error: any) {
        console.error('B2 Get Upload URL Error:', error);
        throw new Error(`Failed to get B2 upload URL: ${error.message}`);
    }
  }
);
