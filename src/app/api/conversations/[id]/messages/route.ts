import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const ALLOWED_ROLES = ["user", "assistant", "system"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { id: conversationIdParam } = await params;
  const conversationId = Number(conversationIdParam);
  if (!Number.isInteger(conversationId) || conversationId < 1) {
    return NextResponse.json(
      { error: "유효하지 않은 대화 ID입니다." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("messages fetch error:", error);
      return NextResponse.json(
        { error: "메시지를 불러오지 못했습니다." },
        { status: 500 }
      );
    }

    const messages = (data ?? []).map((row) => ({
      id: String(row.id),
      role: row.role as "user" | "assistant" | "system",
      content: row.content ?? "",
    }));

    return NextResponse.json(messages);
  } catch (e) {
    console.error("messages GET error:", e);
    return NextResponse.json(
      { error: "메시지를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const { id: conversationIdParam } = await params;
  const conversationId = Number(conversationIdParam);
  if (!Number.isInteger(conversationId) || conversationId < 1) {
    return NextResponse.json(
      { error: "유효하지 않은 대화 ID입니다." },
      { status: 400 }
    );
  }

  let body: { role?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON이 아닙니다." },
      { status: 400 }
    );
  }

  const { role, content } = body;
  if (!role || typeof content !== "string") {
    return NextResponse.json(
      { error: "role과 content는 필수이며, content는 문자열이어야 합니다." },
      { status: 400 }
    );
  }
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return NextResponse.json(
      { error: "role은 'user', 'assistant', 'system' 중 하나여야 합니다." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role,
        content: content.trim(),
      })
      .select("id, conversation_id, role, content, created_at")
      .single();

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "해당 대화를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      console.error("messages insert error:", error);
      return NextResponse.json(
        { error: "메시지 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: String(data.id),
        conversation_id: data.conversation_id,
        role: data.role,
        content: data.content,
        created_at: data.created_at,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("messages POST error:", e);
    return NextResponse.json(
      { error: "메시지 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
