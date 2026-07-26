import { NextResponse } from 'next/server';

import { getRecentNotifications } from '@/lib/notifications/server';

export async function GET(request: Request) {
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? 5);
    const notifications = await getRecentNotifications(Number.isFinite(limit) ? limit : 5);
    return NextResponse.json({ data: notifications });
}
