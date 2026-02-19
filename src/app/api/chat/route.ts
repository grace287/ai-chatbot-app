import { convertToCoreMessages, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/** 개발용 Mock 모드 (CHAT_MOCK=true 시 OpenAI 호출 없이 목 응답 스트림 반환) */
const CHAT_MOCK = process.env.CHAT_MOCK === "true";

/** OpenAI 모델 ID (gpt-5-nano는 없음 → gpt-4o-mini 또는 gpt-4o-nano 사용) */
const CHAT_MODEL_ID = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

/** useChat이 파싱하는 데이터 스트림 형식으로 Mock 스트림 생성 (0: 텍스트, d: finish_message) */
function createMockStreamResponse(): Response {
  const encoder = new TextEncoder();
  const mockText = "Mock 응답입니다. (개발용 — CHAT_MOCK=true)"
  // 데이터 스트림 형식: code:JSON.stringify(value)\n
  const textLine = `0:${JSON.stringify(mockText)}\n`;
  const finishLine = `d:${JSON.stringify({ finishReason: "stop" })}\n`;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(textLine));
      controller.enqueue(encoder.encode(finishLine));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "메시지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (CHAT_MOCK) {
      return createMockStreamResponse();
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[api/chat] OPENAI_API_KEY가 설정되지 않았습니다.");
      return new Response(
        JSON.stringify({ error: "OpenAI API 키가 설정되지 않았습니다." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = streamText({
      model: openai(CHAT_MODEL_ID),
      system: "당신은 친절한 한국어 챗봇 도우미입니다.",
      messages: convertToCoreMessages(messages as UIMessage[]),
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[api/chat] stream error:", err);
        return msg;
      },
    });
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
