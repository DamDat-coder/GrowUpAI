import { Message } from "@/types/message";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypingMarkdown from "./TypingMarkDown";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, Copy, Check, Pencil } from "lucide-react";

export default function ChatMessages({
  messages,
  isLoading,
  onEditMessage,
}: {
  messages: Message[];
  isLoading: boolean;
  onEditMessage: (idx: number, text: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setShowScrollBtn(!isAtBottom);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleEdit = (idx: number, text: string) => {
    setEditingIdx(idx);
    setEditText(text);
  };

  const handleSave = (idx: number) => {
    onEditMessage(idx, editText);
    setEditingIdx(null);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 w-full overflow-y-auto custom-scrollbar pt-10 px-4 scroll-hidden"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-20">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          const isLast = idx === messages.length - 1;
          const hasCode = m.content.includes("```");

          return (
            <div
              key={idx}
              className={`flex w-full ${
                isUser
                  ? "justify-end"
                  : "justify-start border-t border-gray-100 dark:border-white/5 pt-6"
              }`}
            >
              {/* ✅ chỉ giữ 1 group ở đây */}
              <div className="relative group max-w-[85%]">
                <div
                  className={`text-sm leading-7 ${
                    isUser
                      ? "p-4 rounded-2xl shadow-sm bg-[#109150] text-white"
                      : "w-full text-gray-800 dark:text-gray-200"
                  } whitespace-pre-wrap`}
                >
                  {/* EDIT MODE */}
                  {isUser && editingIdx === idx ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSave(idx);
                        }
                        if (e.key === "Escape") {
                          setEditingIdx(null);
                        }
                      }}
                      className="min-w-56 tablet:min-w-96 bg-transparent outline-none"
                    />
                  ) : isUser ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  ) : isLast ? (
                    <TypingMarkdown text={m.content} />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* COPY BUTTON */}
                {(isUser || hasCode) && (
                  <button
                    onClick={() => handleCopy(m.content, idx)}
                    className="
                      absolute -bottom-8 right-2
                      opacity-0 group-hover:opacity-100
                      transition
                      p-1 rounded-md
                      hover:bg-gray-200 dark:hover:bg-gray-700
                    "
                  >
                    {copiedIdx === idx ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}

                {/* EDIT BUTTON (USER ONLY) */}
                {isUser && (
                  <button
                    onClick={() => handleEdit(idx, m.content)}
                    className="
                      absolute -bottom-8 right-8
                      opacity-0 group-hover:opacity-100
                      transition
                      p-1 rounded-md
                      hover:bg-gray-200 dark:hover:bg-gray-700
                    "
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* LOADING */}
        {isLoading && (
          <div className="flex w-full justify-start border-t border-gray-100 dark:border-white/5 pt-6">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* SCROLL BUTTON */}
      {showScrollBtn && (
        <button
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="
            fixed bottom-24 right-6
            bg-[#1f1f1f] text-white
            p-2 rounded-full shadow-lg
            hover:bg-[#323232] transition
            border
          "
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}
