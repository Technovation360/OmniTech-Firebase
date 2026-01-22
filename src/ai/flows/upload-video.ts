'use server';
/**
 * @fileOverview A server-side flow to upload a video to Backblaze B2.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import B2 from 'backblaze-b2';
import { v4 as uuidv4 } from 'uuid';

const UploadVideoInputSchema = z.object({
  fileContent: z.string().describe('The base64 encoded content of the video file.'),
  fileName: z.string().describe('The name of the file.'),
  fileType: z.string().describe('The MIME type of the file.'),
});

export type UploadVideoInput = z.infer<typeof UploadVideoInputSchema>;

const UploadVideoOutputSchema = z.object({
  videoUrl: z.string().url().describe('The public URL of the uploaded video.'),
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
    // In a real app, you'd want more robust error handling and to authorize the B2 instance properly.
    if (!process.env.B2_APPLICATION_KEY_ID || !process.env.B2_APPLICATION_KEY || !process.env.B2_BUCKET_ID || !process.env.B2_BUCKET_NAME || !process.env.B2_BUCKET_Endpoint) {
      console.log('Mocking B2 upload since credentials are not set.');
      // Return a placeholder URL for development without credentials
      return { videoUrl: `https://fake-b2-url.com/${input.fileName}` };
    }
    
    await b2.authorize();

    const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID!,
    });

    const fileBuffer = Buffer.from(input.fileContent, 'base64');
    const uniqueFileName = `${uuidv4()}-${input.fileName}`;

    await b2.uploadFile({
        uploadUrl: uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName: uniqueFileName,
        data: fileBuffer,
        mime: input.fileType,
    });
    
    // Construct the public URL from environment variables.
    const bucketHost = `${process.env.B2_BUCKET_NAME}.${process.env.B2_BUCKET_Endpoint}`;
    const fileUrl = `https://${bucketHost}/${uniqueFileName}`;

    return { videoUrl: fileUrl };
  }
);
