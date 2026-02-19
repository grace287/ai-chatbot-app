import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

function getDateGroup(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "7days";
  return "30days";
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json([]);
  }
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("conversations fetch error:", error);
      return NextResponse.json([]);
    }

    const conversations = (data ?? []).map((row) => ({
      id: String(row.id),
      title: row.title ?? "제목 없음",
      date: row.created_at ? getDateGroup(row.created_at) : "today",
    }));

    return NextResponse.json(conversations);
  } catch (e) {
    console.error("conversations GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가하세요." },
      { status: 503 }
    );
  }
  try {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ title: "새 대화" })
      .select("id, title, created_at")
      .single();

    if (error) {
      console.error("conversations insert error:", error);
      return NextResponse.json(
        { error: "대화 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    const conversation = {
      id: String(data.id),
      title: data.title ?? "새 대화",
      date: data.created_at ? getDateGroup(data.created_at) : "today",
    };

    return NextResponse.json(conversation, { status: 201 });
  } catch (e) {
    console.error("conversations POST error:", e);
    return NextResponse.json(
      { error: "대화 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
