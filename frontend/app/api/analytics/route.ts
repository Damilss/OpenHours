import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("course_id");
    if (!courseId) {
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

    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .eq("professor_id", user.id)
      .maybeSingle();

    if (!course) {
      return NextResponse.json({ error: "Professor course access required" }, { status: 403 });
    }

    const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
    const res = await fetch(`${fastapiUrl}/analytics/${courseId}`, {
      headers: {
        Authorization: req.headers.get("authorization") ?? "",
      },
    });

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
