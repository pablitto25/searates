import { updateContainersData } from '@/lib/updateContainers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await updateContainersData();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update containers" }, { status: 500 });
    }
}