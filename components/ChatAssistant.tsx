import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { User, UserRole } from "../types";

type ChatRole = "DONOR" | "NGO" | "ADMIN";

interface ChatApiPayload {
  intent?: string;
  role?: ChatRole;
  reply?: string;
  suggestions?: string[];
  usedGemini?: boolean;
  data?: Record<string, unknown>;
}

interface ChatApiResponse {
  success: boolean;
  message: string;
  data: ChatApiPayload;
}

interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  meta?: {
    intent?: string;
    usedGemini?: boolean;
  };
  payload?: Record<string, unknown>;
  suggestions?: string[];
}

const ROLE_COPY: Record<ChatRole, { title: string; subtitle: string; starters: string[] }> = {
  NGO: {
    title: "NGO Ops Copilot",
    subtitle: "Nearby food, pickup priorities, and safety checks",
    starters: [
      "Find nearby food available now",
      "Suggest the best pickup options",
      "Is this food still safe?",
    ],
  },
  DONOR: {
    title: "Donor Posting Assistant",
    subtitle: "Post food faster with quantity and expiry guidance",
    starters: [
      "Help me post this donation",
      "How much food can feed 50 people?",
      "Suggest expiry time for cooked rice",
    ],
  },
  ADMIN: {
    title: "Admin Insights Assistant",
    subtitle: "Ask for platform analytics and demand trends",
    starters: [
      "How much food saved this week?",
      "Which area has highest demand?",
      "Show fulfillment trends",
    ],
  },
};

const getWelcomeMessage = (user: User): ChatMessage => {
  const role = user.role as ChatRole;
  const copy = ROLE_COPY[role];

  return {
    id: "welcome",
    sender: "assistant",
    text: `Hello ${user.name.split(" ")[0]}, I can help with ${copy.subtitle.toLowerCase()}.`,
    suggestions: copy.starters,
  };
};

const formatLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const formatValue = (value: unknown): string => {
  if (value == null) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
};

const renderArraySummary = (items: unknown[]) => {
  const safeItems = items.slice(0, 3);

  return safeItems.map((item, index) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const entries = Object.entries(item as Record<string, unknown>).slice(0, 4);
      return (
        <div key={index} className="rounded-2xl border border-emerald-100 bg-white/80 p-3 text-xs text-slate-700">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-3 py-1">
              <span className="min-w-0 font-semibold text-slate-500">{formatLabel(key)}</span>
              <span className="max-w-[11rem] break-words text-right sm:max-w-[13rem]">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div key={index} className="rounded-2xl border border-emerald-100 bg-white/80 p-3 text-xs text-slate-700">
        {formatValue(item)}
      </div>
    );
  });
};

const renderPayload = (payload?: Record<string, unknown>) => {
  if (!payload || Object.keys(payload).length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {Object.entries(payload).map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div key={key} className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {formatLabel(key)}
              </div>
              <div className="space-y-2">{renderArraySummary(value)}</div>
            </div>
          );
        }

        if (value && typeof value === "object") {
          const entries = Object.entries(value as Record<string, unknown>);
          return (
            <div key={key} className="rounded-2xl border border-emerald-100 bg-white/80 p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {formatLabel(key)}
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                {entries.map(([innerKey, innerValue]) => (
                  <div key={innerKey} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 font-semibold text-slate-500">{formatLabel(innerKey)}</span>
                    <span className="max-w-[11rem] break-words text-right sm:max-w-[13rem]">{formatValue(innerValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs text-slate-700">
            <span className="font-semibold text-slate-500">{formatLabel(key)}</span>
            <span className="text-right">{formatValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

const ChatAssistant: React.FC<{ user: User; mode?: "floating" | "embedded" }> = ({
  user,
  mode = "floating",
}) => {
  const role = user.role as ChatRole;
  const copy = useMemo(() => ROLE_COPY[role], [role]);
  const isEmbedded = mode === "embedded";
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getWelcomeMessage(user)]);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([getWelcomeMessage(user)]);
    setInput("");
    setIsOpen(isEmbedded);
  }, [isEmbedded, user]);

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [messages, isOpen]);

  const submitMessage = async (rawMessage?: string) => {
    const message = (rawMessage ?? input).trim();
    if (!message || isSending) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setIsOpen(true);

    try {
      const response = await api.post<ChatApiResponse>("/api/chat", { message });
      const payload = response.data?.data || {};

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        sender: "assistant",
        text: payload.reply || "I processed that request, but I do not have a reply yet.",
        meta: {
          intent: payload.intent,
          usedGemini: payload.usedGemini,
        },
        payload: payload.data,
        suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const fallbackText =
        error?.response?.data?.message ||
        "The assistant could not reach the chat service right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          sender: "assistant",
          text: fallbackText,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!isEmbedded && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full border border-emerald-200 bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] transition-transform hover:-translate-y-0.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
            AI
          </span>
          <span className="hidden sm:inline">{copy.title}</span>
        </button>
      )}

      {isOpen && (
        <div
          className={`flex flex-col overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#f8fffb_0%,#eef6ff_100%)] ${
            isEmbedded
              ? "min-h-[calc(100svh-12rem)] rounded-[28px] shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
              : "fixed bottom-3 right-3 z-40 h-[min(78vh,42rem)] w-[min(calc(100vw-1.5rem),24rem)] rounded-[28px] shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:bottom-5 sm:right-5"
          }`}
        >
          <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-black tracking-[0.12em] text-emerald-300">{copy.title}</div>
                <div className="mt-1 text-xs text-slate-300">{copy.subtitle}</div>
              </div>
              {!isEmbedded && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          <div ref={viewportRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-[24px] px-4 py-3 shadow-sm sm:max-w-[88%] ${
                    message.sender === "user"
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-6">{message.text}</div>
                  {message.sender === "assistant" && renderPayload(message.payload)}
                  {message.sender === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => submitMessage(suggestion)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  Thinking through that request...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
            <div className="mb-3 flex flex-wrap gap-2">
              {copy.starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => submitMessage(starter)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {starter}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage();
                  }
                }}
                rows={2}
                placeholder="Ask the assistant something useful..."
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => submitMessage()}
                disabled={isSending || !input.trim()}
                className="rounded-2xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-4"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
