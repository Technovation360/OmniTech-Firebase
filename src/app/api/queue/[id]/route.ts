
import { getQueueInfoByScreenId } from '@/lib/data';
import { getClinicGroups, getPatients } from '@/lib/server-data';
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

    const allGroups = await getClinicGroups();
    const allPatients = await getPatients();

    const queueInfo = await getQueueInfoByScreenId(screenId, allGroups, allPatients);

    return NextResponse.json(queueInfo);
  } catch (error) {
    console.error('Error fetching queue info:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
