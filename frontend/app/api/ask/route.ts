import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courseId = body?.course_id;

    if (typeof courseId !== "string" || !courseId) {
      return NextResponse.json({ error: "course_id required" }, { status: 400 });
    }

    const supabase = createRouteClient(req);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "student") {
      return NextResponse.json({ error: "Student access required" }, { status: 403 });
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }

    const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
    const res = await fetch(`${fastapiUrl}/ask`, {
      method: "POST",
      headers: {
        Authorization: req.headers.get("authorization") ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("/api/ask error:", err);
    return NextResponse.json(
      { error: "Failed to reach AI backend" },
      { status: 502 }
    );
  }
}
