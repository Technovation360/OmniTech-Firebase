'use server';
/**
 * @fileOverview A server-side flow to upload a video to Backblaze B2.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';

const UploadVideoInputSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileContent: z.string().describe("The Base64-encoded content of the file."),
});

export type UploadVideoInput = z.infer<typeof UploadVideoInputSchema>;

const UploadVideoOutputSchema = z.object({
  videoUrl: z.string().describe("The public URL of the uploaded video."),
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
  async (input) => {
    if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_ID || !process.env.B2_BUCKET_NAME) {
        console.log('Mocking B2 upload since credentials are not set.');
        // Return a placeholder URL for development without credentials
        return { 
            videoUrl: `https://mock-upload-url.com/file/${process.env.B2_BUCKET_NAME || 'mock-bucket'}/${uuidv4()}-${input.fileName}`,
        };
    }
    
    const { data: authData } = await b2.authorize(); // ensures you have a valid token

    const fileBuffer = Buffer.from(input.fileContent, 'base64');
    const uniqueFileName = `${uuidv4()}-${encodeURIComponent(input.fileName)}`;

    try {
        const { data: uploadData } = await b2.getUploadUrl({
            bucketId: process.env.B2_BUCKET_ID!,
        });

        const { data: responseData } = await b2.uploadFile({
            uploadUrl: uploadData.uploadUrl,
            uploadAuthToken: uploadData.authorizationToken,
            fileName: uniqueFileName,
            data: fileBuffer,
            mime: input.fileType,
        });
        
        const friendlyUrl = `https://${authData.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${responseData.fileName}`;
        
        return { videoUrl: friendlyUrl };

    } catch (error: any) {
        console.error('B2 Upload Error:', error);
        throw new Error(`Failed to upload video: ${error.message}`);
    }
  }
);
