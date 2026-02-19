import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  const body = await request.json();
  const { role, content } = body as { role: string; content: string };

  // TODO: conversationId, role, content로 messages 테이블에 저장

  return NextResponse.json(
    { conversationId, role, content },
    { status: 201 }
  );
}
