# Silver Star — AI 챗봇

Next.js 기반 스트리밍 AI 챗봇 앱. 대화별 메시지를 Supabase에 저장하고, OpenAI(또는 Mock)로 스트리밍 응답을 받습니다.

---

## 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | Next.js 15 (App Router) |
| **UI** | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| **AI** | Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) — useChat, streamText, 데이터 스트림 |
| **DB** | Supabase (PostgreSQL) — 대화·메시지 저장 |
| **기타** | next-themes(다크 모드), sonner(토스트), lucide-react(아이콘), zod |

---

## 프로젝트 구조

```
ai-chatbot-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # POST: 스트리밍 챗 (OpenAI / Mock)
│   │   │   └── conversations/
│   │   │       ├── route.ts          # GET: 목록, POST: 대화 생성
│   │   │       ├── check/
│   │   │       │   └── route.ts
│   │   │       └── [id]/
│   │   │           └── messages/
│   │   │               └── route.ts  # GET: 메시지 목록, POST: 메시지 저장
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn (button, dropdown-menu, scroll-area)
│   │   ├── chat-interface.tsx        # 채팅 영역, useChat, 메시지 버블
│   │   ├── chat-layout.tsx           # 레이아웃, 사이드바 토글
│   │   ├── chat-sidebox.tsx          # 대화 목록, 지식 보관함 UI
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts
│   │   └── utils.ts
│   └── schema.sql                    # Supabase 테이블 정의 (conversations, messages)
├── .env.local                        # OPENAI_API_KEY, SUPABASE, CHAT_MOCK 등
├── package.json
└── README.md
```

---

## 환경 변수

`.env.local` 예시:

```env
# OpenAI (CHAT_MOCK=true 면 미사용)
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini

# 개발용 Mock (true 시 실제 API 호출 없이 목 응답)
CHAT_MOCK=true

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 실행

```bash
npm install
npm run dev
```

- 빌드: `npm run build`
- 프로덕션: `npm run start`
- 린트: `npm run lint`

---

## 주요 기능

- **대화 목록**: 사이드바에서 대화 생성·선택, URL `/?id=대화ID` 와 연동
- **메시지 로드**: 선택한 대화의 메시지를 API로 불러와 useChat `setMessages`에 맞게 반영
- **스트리밍 채팅**: useChat + `/api/chat` 데이터 스트림, 응답 완료 시 Supabase에 assistant 메시지 저장
- **Mock 모드**: `CHAT_MOCK=true` 로 OpenAI 없이 스트리밍 UI 테스트
- **Silver Star 테마**: 다크 그라디언트, 15px 타이포, 호버 glow, 지식 보관함 톤

---

## DB 스키마

Supabase에서 `src/schema.sql` 참고해 테이블 생성:

- **conversations**: `id`, `title`, `created_at`
- **messages**: `id`, `conversation_id`, `role`, `content`, `created_at`

---

## 라이선스

Private.
