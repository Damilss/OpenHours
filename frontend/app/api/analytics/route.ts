import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("course_id");
    if (!courseId) {
      return NextResponse.json({ error: "course_id required" }, { status: 400 });
    }

    const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
    const res = await fetch(`${fastapiUrl}/analytics/${courseId}`);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("/api/analytics error:", err);
    return NextResponse.json(
      { error: "Failed to reach analytics backend" },
      { status: 502 }
    );
  }
}
