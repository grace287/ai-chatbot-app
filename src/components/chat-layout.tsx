"use client"

import { useState, Suspense } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChatSidebox } from "@/components/chat-sidebox"
import { ChatInterface } from "@/components/chat-interface"
import { ThemeToggle } from "@/components/theme-toggle"

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ChatSidebox />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-border transition-transform duration-300 ease-in-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ChatSidebox />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-3 size-8 text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Main Chat Area — starlight gradient */}
      <div className="silver-main-gradient flex flex-1 flex-col">
        {/* Mobile Header */}
        <div className="flex h-12 items-center justify-between border-b border-border px-3 md:hidden">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSidebarOpen(true)}
              aria-label="사이드바 열기"
            >
              <Menu className="size-5" />
            </Button>
            <span className="ml-2 text-[15px] font-semibold text-foreground">
              Silver Star
            </span>
          </div>
          <ThemeToggle />
        </div>
        <Suspense fallback={<div className="flex flex-1 items-center justify-center bg-background" />}>
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  )
}
