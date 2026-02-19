import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/** OpenAI 모델 ID (gpt-5-nano는 없음 → gpt-4o-mini 또는 gpt-4o-nano 사용) */
const CHAT_MODEL_ID = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai(CHAT_MODEL_ID),
      system: "당신은 친절한 한국어 챗봇 도우미입니다.",
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[api/chat] error:", err);
    return new Response(
      JSON.stringify({
        error: "챗 API 처리 중 오류가 발생했습니다.",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
