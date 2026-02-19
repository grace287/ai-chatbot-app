import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * GET /api/conversations/check
 * Supabase 연결 여부만 확인 (env 설정 확인용, 값은 노출하지 않음)
 */
export async function GET() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        message:
          ".env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가한 뒤 서버를 재시작하세요.",
      },
      { status: 503 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Supabase 클라이언트 생성 실패." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Supabase 연결 설정됨.",
  });
}
