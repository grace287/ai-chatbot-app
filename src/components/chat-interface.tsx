"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useChat, type Message } from "@ai-sdk/react"
import { Send, Bot, User, Sparkles, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

/** API 메시지 응답 형태 (GET /api/conversations/[id]/messages) */
interface ApiMessage {
  id: string
  role: string
  content: string
}

/** UI에 표시할 메시지 (id, role, content만 사용) */
interface DisplayMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

/** API 응답을 AI SDK Message[]로 변환 (setMessages는 Message[]를 받고, 내부적으로 UIMessage로 채움) */
function apiMessagesToMessages(data: ApiMessage[]): Message[] {
  const allowedRoles = ["user", "assistant", "system"] as const
  return data.map((m) => {
    const role = allowedRoles.includes(m.role as (typeof allowedRoles)[number])
      ? (m.role as Message["role"])
      : "assistant"
    const content = m.content ?? ""
    return {
      id: m.id,
      role,
      content,
      parts: [{ type: "text" as const, text: content }],
    }
  })
}

export function ChatInterface() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idFromUrl = searchParams.get("id")
  const [conversationId, setConversationId] = useState<string | null>(idFromUrl)
  const conversationIdRef = useRef<string | null>(conversationId)

  // URL의 대화 id가 바뀔 때마다 감지하여 state·ref 동기화
  useEffect(() => {
    setConversationId(idFromUrl)
  }, [idFromUrl])

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages: chatMessages,
    append,
    setMessages: setChatMessages,
    status: chatStatus,
  } = useChat({
    api: "/api/chat",
    id: conversationId ?? undefined,
    onFinish: async (message) => {
      const currentId = conversationIdRef.current
      if (!currentId) return

      const content =
        (message.parts ?? [])
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("")
          .trim() || (typeof message.content === "string" ? message.content.trim() : "")

      if (!content) return

      try {
        const res = await fetch(
          `/api/conversations/${currentId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "assistant", content }),
          }
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data?.error ?? "AI 응답 저장에 실패했습니다.")
        }
      } catch {
        toast.error("AI 응답 저장에 실패했습니다.")
      }
    },
  })

  const [input, setInput] = useState("")

  // 대화 id가 바뀔 때마다 해당 id의 메시지 목록 조회 → AI SDK Message[]로 변환 후 setMessages에 할당
  useEffect(() => {
    if (!conversationId) {
      setChatMessages([])
      return
    }
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((res) => res.json())
      .then((data: ApiMessage[] | { error?: string }) => {
        if (Array.isArray(data)) {
          setChatMessages(apiMessagesToMessages(data))
        } else {
          setChatMessages([])
        }
      })
      .catch(() => setChatMessages([]))
  }, [conversationId])

  const handleStartNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error("대화 생성에 실패했습니다.")
        return
      }
      const id = data?.id
      if (id) {
        window.dispatchEvent(new CustomEvent("conversations-refresh"))
        router.push(`/?id=${id}`)
      }
    } catch {
      toast.error("대화 생성에 실패했습니다.")
    }
  }

  const displayMessages: DisplayMessage[] = chatMessages.map((m) => {
    const fromParts = (m.parts ?? [])
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
    return {
      id: m.id,
      role: (m.role === "user" || m.role === "assistant" || m.role === "system"
        ? m.role
        : "assistant") as DisplayMessage["role"],
      content: fromParts || (typeof m.content === "string" ? m.content : ""),
    }
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])


  const sendMessageHandler = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || !conversationId) return

    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? "메시지 저장에 실패했습니다.")
        return
      }
      append({ role: "user", content })
    } catch {
      toast.error("메시지 저장에 실패했습니다.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessageHandler(e)
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
              {displayMessages.map((msg) => (
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
          onSubmit={sendMessageHandler}
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
              disabled={!input.trim() || chatStatus === "submitted" || chatStatus === "streaming"}
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

function MessageBubble({ message }: { message: DisplayMessage }) {
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
