import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-5-nano"),
    system: "당신은 친절한 한국어 챗봇 도우미입니다.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
