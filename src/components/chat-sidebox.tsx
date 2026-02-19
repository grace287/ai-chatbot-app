"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Plus, MessageSquare, Search, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Conversation {
  id: string
  title: string
  date: string
  active?: boolean
}

function groupByDate(conversations: Conversation[]) {
  const groups: { label: string; items: Conversation[] }[] = []
  const map: Record<string, Conversation[]> = {}

  const dateLabels: Record<string, string> = {
    today: "오늘",
    yesterday: "어제",
    "7days": "지난 7일",
    "30days": "지난 30일",
  }

  for (const conv of conversations) {
    if (!map[conv.date]) {
      map[conv.date] = []
    }
    map[conv.date].push(conv)
  }

  for (const key of ["today", "yesterday", "7days", "30days"]) {
    if (map[key]) {
      groups.push({ label: dateLabels[key], items: map[key] })
    }
  }

  return groups
}

interface ChatSidebarProps {
  className?: string
}

export function ChatSidebox({ className }: ChatSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get("id")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeId, setActiveId] = useState("")

  // URL의 id와 채팅 목록 선택 상태 동기화
  useEffect(() => {
    if (idFromUrl) setActiveId(idFromUrl)
  }, [idFromUrl])

  const handleSelectConversation = (id: string) => {
    const idStr = String(id)
    setActiveId(idStr)
    router.push(`/?id=${idStr}`)
  }

  const fetchConversations = () => {
    return fetch("/api/conversations")
      .then((res) => res.json())
      .then((data: Conversation[]) => {
        const list = Array.isArray(data) ? data : []
        setConversations(list)
        if (list.length > 0 && !idFromUrl) {
          setActiveId(list[0].id)
        }
        return list
      })
      .catch(() => {
        setConversations([])
        return []
      })
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    const handler = () => fetchConversations()
    window.addEventListener("conversations-refresh", handler)
    return () => window.removeEventListener("conversations-refresh", handler)
  }, [])

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const groups = groupByDate(filtered)

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        toast.error("대화 생성에 실패했습니다.")
        return
      }

      const list = await fetchConversations()
      const newId = data?.id ?? list[0]?.id
      if (newId) {
        setActiveId(newId)
        router.push(`/?id=${newId}`)
      }
    } catch {
      toast.error("대화 생성에 실패했습니다.")
    }
  }

  const handleDelete = (id: string) => {
    setConversations(conversations.filter((c) => c.id !== id))
    if (activeId === id && conversations.length > 1) {
      const remaining = conversations.filter((c) => c.id !== id)
      setActiveId(remaining[0]?.id ?? "")
    }
  }

  return (
    <aside
      className={cn(
        "silver-sidebar-gradient flex h-full w-[280px] flex-col border-r border-sidebar-border/80 text-sidebar-foreground",
        className
      )}
    >
      {/* Header — Knowledge archive feel */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/90 shadow-sm">
            <MessageSquare className="size-5 text-primary-foreground" />
          </div>
          <h1 className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
            <Link href="/" className="hover:text-primary/90 hover:underline">
              Silver Star
            </Link>
          </h1>
        </div>
        <p className="mt-1.5 px-0.5 text-[12px] uppercase tracking-widest text-muted-foreground/80">
          ai chatbot
        </p>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3">
        <Button
          onClick={handleNewChat}
          className="silver-glow-hover h-10 w-full gap-2 rounded-lg bg-primary px-4 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          새 대화 시작하기
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="대화 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg bg-sidebar-accent/80 pl-9 pr-3 text-[15px] text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-4 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground/90">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeId === String(conv.id)}
                    onSelect={() => handleSelectConversation(conv.id)}
                    onDelete={() => handleDelete(conv.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border/80 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/90 text-[13px] font-bold text-primary-foreground">
            U
          </div>
          <div className="flex-1 truncate">
            <p className="text-[15px] font-medium text-sidebar-foreground">User</p>
            <p className="text-[12px] text-muted-foreground/80">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect()}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-[15px] transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            aria-label="대화 메뉴"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100",
              isActive && "opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>
            <Pencil className="mr-2 size-4" />
            이름 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="mr-2 size-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  )
}
