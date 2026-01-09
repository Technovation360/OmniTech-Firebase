import { getQueueInfoByScreenId } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // prevent caching

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const screenId = params.id;
    if (!screenId) {
      return NextResponse.json({ message: 'Screen ID is required' }, { status: 400 });
    }

    const queueInfo = await getQueueInfoByScreenId(screenId);

    return NextResponse.json(queueInfo);
  } catch (error) {
    console.error('Error fetching queue info:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
