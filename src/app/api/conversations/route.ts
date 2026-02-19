import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET() {
  // TODO: 대화 목록 조회
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

export async function POST() {
  // TODO: 새 대화 생성
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
