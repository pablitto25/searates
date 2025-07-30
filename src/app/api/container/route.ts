import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const containerNumber = searchParams.get("number");

    if (!containerNumber) {
        return NextResponse.json({ error: "Missing container number" }, { status: 400 });
    }

    try {
        const res = await fetch(`http://54.82.251.60:8080/DataEntity/ContainerNumber/${containerNumber}`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}