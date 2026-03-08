export interface Session {
  id: string
  chat_id?: string
  name: string
  status?: string
  user_id?: string | null
  user_name?: string | null
  user_mail?: string | null
  user_data?: unknown | null
  created_at?: string
  create_time?: number
  update_time?: number
  create_date?: string
  update_date?: string
  messages?: Message[]
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  fileurls: string[]
  action: unknown[]
  created_at: number
}

// SSE Event types
export interface SSEProgressEvent {
  type: "progress"
  phase: string
  status: string
  session_id: string
  ts: string
}

export interface SSEToolStartEvent {
  type: "process"
  subtype: "tool_start"
  tool_name: string
  tool_call_id: string
  input: Record<string, unknown>
  session_id: string
  ts: string
}

export interface SSEToolEndEvent {
  type: "process"
  subtype: "tool_end"
  tool_name: string
  tool_call_id: string
  status: "completed" | "error"
  output_preview?: string
  output_raw?: string
  output_json?: unknown
  error?: string
  session_id: string
  ts: string
}

export interface SSEAnswerDeltaEvent {
  type: "answer_delta"
  delta: string
  session_id?: string
  ts?: string
}

export interface SSEFinalEvent {
  type: "final"
  answer: string
  fileurls: string[]
  id: string
  answer_id: string
  question_id: string
  action: unknown[]
  session_id: string
}

export interface SSEErrorEvent {
  type: "error"
  session_id: string
  message: string
  ts: string
}

export type SSEEvent =
  | SSEProgressEvent
  | SSEToolStartEvent
  | SSEToolEndEvent
  | SSEAnswerDeltaEvent
  | SSEFinalEvent
  | SSEErrorEvent

// UI types
export interface ToolCall {
  tool_call_id: string
  tool_name: string
  status: "running" | "completed" | "error"
  input?: Record<string, unknown>
  output_raw?: string
  output_preview?: string
  error?: string
  expanded: boolean
}

export interface UIMessage {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCall[]
  isStreaming?: boolean
  isThinking?: boolean
  sessionId?: string
  questionId?: string
}
