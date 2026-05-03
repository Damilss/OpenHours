import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const courseId = formData.get("course_id");

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
    const res = await fetch(`${fastapiUrl}/upload`, {
      method: "POST",
      headers: {
        Authorization: req.headers.get("authorization") ?? "",
      },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("/api/upload error:", err);
    return NextResponse.json(
      { error: "Failed to reach upload backend" },
      { status: 502 }
    );
  }
}
