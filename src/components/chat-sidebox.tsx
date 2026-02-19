"use client"

import { useState } from "react"
import { Plus, MessageSquare, Search, MoreHorizontal, Trash2, Pencil } from "lucide-react"
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

const SAMPLE_CONVERSATIONS: Conversation[] = [
  { id: "1", title: "React 19의 새로운 기능 정리", date: "today", active: true },
  { id: "2", title: "Python으로 데이터 분석 시작하기", date: "today" },
  { id: "3", title: "이메일 마케팅 전략 수립", date: "today" },
  { id: "4", title: "Next.js App Router 마이그레이션", date: "yesterday" },
  { id: "5", title: "영어 비즈니스 이메일 작성 도움", date: "yesterday" },
  { id: "6", title: "TypeScript 제네릭 활용법", date: "7days" },
  { id: "7", title: "PostgreSQL 쿼리 최적화 방법", date: "7days" },
  { id: "8", title: "Docker 컨테이너 배포 설정", date: "7days" },
  { id: "9", title: "2026년 기술 트렌드 요약", date: "30days" },
  { id: "10", title: "CI/CD 파이프라인 설계 가이드", date: "30days" },
]

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
  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeId, setActiveId] = useState("1")

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const groups = groupByDate(filtered)

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "New conversation",
      date: "today",
    }
    setConversations([newConv, ...conversations])
    setActiveId(newConv.id)
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
        "flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Header - Title */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
            <MessageSquare className="size-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">
            AI Chat
          </h1>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3">
        <Button
          onClick={handleNewChat}
          className="h-10 w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
            className="h-9 w-full rounded-lg bg-sidebar-accent pl-9 pr-3 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-4 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeId === conv.id}
                    onSelect={() => setActiveId(conv.id)}
                    onDelete={() => handleDelete(conv.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            U
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-sidebar-foreground">User</p>
            <p className="text-xs text-muted-foreground">Free plan</p>
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
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <span className="flex-1 truncate">{conversation.title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100",
              isActive && "opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.stopPropagation()
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
