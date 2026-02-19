"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Send, Bot, User, Sparkles, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    role: "user",
    content: "React Server Components가 정확히 뭔가요? 쉽게 설명해줄 수 있어요?",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "React Server Components(RSC)는 서버에서만 실행되는 새로운 유형의 컴포넌트입니다. 기존 React 컴포넌트와 다르게 브라우저가 아닌 서버에서 동작하며, 다음과 같은 장점이 있습니다:\n\n1. **백엔드 리소스에 직접 접근** - API 레이어 없이 데이터베이스, 파일 시스템에 바로 접근 가능\n2. **번들 사이즈 감소** - 서버 전용 코드는 클라이언트로 전송되지 않음\n3. **성능 향상** - 무거운 연산과 데이터 패칭이 서버에서 처리됨\n\n쉽게 비유하면, 기존 컴포넌트는 주방과 식당이 같은 공간에 있는 레스토랑이고, RSC는 주방을 별도 건물로 옮긴 것입니다. 손님(사용자)은 완성된 요리(HTML)만 보게 됩니다.",
  },
  {
    id: "3",
    role: "user",
    content: "RSC와 SSR의 차이점은 뭔가요?",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "좋은 질문입니다! 둘은 관련이 있지만 근본적으로 다릅니다:\n\n**SSR (Server-Side Rendering)**\n- 전체 컴포넌트 트리를 서버에서 HTML로 렌더링\n- 이후 클라이언트에서 \"하이드레이션\" 진행\n- 모든 컴포넌트 코드가 브라우저로 전송됨\n- 컴포넌트가 클라이언트에서 다시 실행됨\n\n**RSC (React Server Components)**\n- 컴포넌트가 서버에 영구적으로 존재\n- 코드가 아닌 렌더링 결과만 클라이언트로 전송\n- 서버 컴포넌트는 클라이언트 JavaScript가 제로\n- 인터랙티브한 클라이언트 컴포넌트와 결합 가능\n\n요약하면, SSR은 컴포넌트가 **언제** 렌더링되는지(서버 먼저, 그다음 클라이언트), RSC는 **어디서** 렌더링되는지(서버만, 클라이언트만, 또는 둘 다)에 관한 것입니다.",
  },
]

export function ChatInterface() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const conversationId = searchParams.get("id")

  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleStartNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error("대화 생성에 실패했습니다.")
        return
      }
      const id = data?.id
      if (id) router.push(`/?id=${id}`)
    } catch {
      toast.error("대화 생성에 실패했습니다.")
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "질문해 주셔서 감사합니다! 요청을 처리하고 있습니다. 이것은 채팅 레이아웃을 보여주기 위한 샘플 응답입니다. 실제 구현에서는 AI 모델에 연결되어 실제 응답을 생성하게 됩니다.",
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  // id 쿼리가 없으면 빈 상태(안내 메시지 + 새 대화 버튼) 렌더링
  if (!conversationId) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">
              React Server Components
            </h1>
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </header>
        <section
          aria-label="대화 선택 안내"
          className="flex flex-1 flex-col items-center justify-center gap-6 px-6"
        >
          <p className="text-center text-muted-foreground">
            새로운 대화를 시작하거나 기존 대화를 선택해주세요
          </p>
          <Button
            onClick={handleStartNewChat}
            className="gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            새 대화 시작하기
          </Button>
        </section>
      </div>
    )
  }

  // id가 있으면 기존 채팅 화면 렌더링
  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* ── Header ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">
            React Server Components
          </h1>
        </div>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Message Panel ── */}
      <section
        aria-label="대화 메시지"
        className="relative min-h-0 flex-1"
      >
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto scroll-smooth"
        >
          <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Input Panel ── */}
      <section
        aria-label="메시지 입력"
        className="shrink-0 border-t border-border bg-card px-4 py-4"
      >
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl"
        >
          <div className="flex items-end gap-3 rounded-2xl bg-secondary p-2 ring-1 ring-border focus-within:ring-2 focus-within:ring-ring transition-shadow">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="size-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-opacity"
              aria-label="메시지 전송"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
        <p className="mx-auto mt-2.5 max-w-3xl text-center text-xs text-muted-foreground">
          AI는 실수할 수 있습니다. 중요한 정보는 반드시 확인하세요.
        </p>
      </section>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground ring-1 ring-border"
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-card text-card-foreground ring-1 ring-border"
        )}
      >
        <MessageContent content={message.content} />
      </div>
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering for bold text and line breaks
  const parts = content.split("\n")

  return (
    <div className="flex flex-col gap-1">
      {parts.map((line, i) => {
        // Convert **bold** to <strong>
        const formatted = line.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold">$1</strong>'
        )
        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: formatted || "&nbsp;" }}
          />
        )
      })}
    </div>
  )
}
