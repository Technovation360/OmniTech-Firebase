'use server';
/**
 * @fileOverview A server-side flow to get a pre-signed download URL from Backblaze B2.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import B2 from 'backblaze-b2';

const GetSignedVideoUrlInputSchema = z.object({
  fileName: z.string().describe('The name of the file in the B2 bucket.'),
});
export type GetSignedVideoUrlInput = z.infer<typeof GetSignedVideoUrlInputSchema>;

const GetSignedVideoUrlOutputSchema = z.object({
  signedUrl: z.string().describe('The pre-signed URL for downloading the video.'),
});
export type GetSignedVideoUrlOutput = z.infer<typeof GetSignedVideoUrlOutputSchema>;

// Ensure B2 credentials are set in environment variables
if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_ID || !process.env.NEXT_PUBLIC_B2_BUCKET_NAME) {
  if (process.env.NODE_ENV === 'production') {
    console.error('Backblaze B2 credentials are not fully configured.');
  } else {
    console.warn('Backblaze B2 credentials are not fully configured. Video playback will be mocked or fail.');
  }
}

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || 'mock-key-id',
  applicationKey: process.env.B2_APPLICATION_KEY || 'mock-key',
});

export async function getSignedVideoUrl(input: GetSignedVideoUrlInput): Promise<GetSignedVideoUrlOutput> {
  return getSignedVideoUrlFlow(input);
}

const getSignedVideoUrlFlow = ai.defineFlow(
  {
    name: 'getSignedVideoUrlFlow',
    inputSchema: GetSignedVideoUrlInputSchema,
    outputSchema: GetSignedVideoUrlOutputSchema,
  },
  async ({ fileName }) => {
    const bucketId = process.env.B2_BUCKET_ID;
    const bucketName = process.env.NEXT_PUBLIC_B2_BUCKET_NAME;

    if (!bucketId || !bucketName) {
        if(process.env.NODE_ENV !== 'production') {
            // Provide a mock video for local development if credentials are not set
            return { signedUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' } 
        }
        throw new Error('B2 bucket information is not configured on the server.');
    }
    
    try {
      await b2.authorize(); // Authorize to get downloadUrl and other account info

      const { data: { authorizationToken } } = await b2.getDownloadAuthorization({
          bucketId: bucketId,
          fileNamePrefix: fileName,
          validDurationInSeconds: 3600, // 1 hour validity
      });
      
      const signedUrl = `${b2.downloadUrl}/file/${bucketName}/${encodeURIComponent(fileName)}?Authorization=${authorizationToken}`;

      return { signedUrl };

    } catch (error: any) {
        console.error('B2 Get Signed URL Error:', error);
        throw new Error(`Failed to get B2 signed URL: ${error.message}`);
    }
  }
);
