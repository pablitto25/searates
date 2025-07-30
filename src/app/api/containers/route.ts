import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("http://54.82.251.60:8080/DataEntity");
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching all containers:", error);
        return NextResponse.json({ error: "Failed to fetch containers" }, { status: 500 });
    }
}