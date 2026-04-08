import { Message } from "@/types/message";
import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import ChatMessageItem from "./ChatMessageItem";

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
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isAtBottom);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
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
      className="flex-1 w-full overflow-y-auto scroll-hidden pt-10 px-4"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-10 pb-20">
        {messages.map((m, idx) => (
          <ChatMessageItem
            key={idx}
            message={m}
            index={idx}
            isLast={idx === messages.length - 1}
            editingIdx={editingIdx}
            editText={editText}
            copiedIdx={copiedIdx}
            onEdit={(i, text) => { setEditingIdx(i); setEditText(text); }}
            onSave={handleSave}
            onCancelEdit={() => setEditingIdx(null)}
            onCopy={handleCopy}
            onSetEditText={setEditText}
          />
        ))}

        {isLoading && <LoadingSkeleton />}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-24 right-6 bg-[#1f1f1f] text-white p-2 rounded-full shadow-lg border border-white/10"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}

// Tách nhỏ phần Loading
function LoadingSkeleton() {
  return (
    <div className="flex w-full justify-start border-t border-gray-100 dark:border-white/5 pt-6">
      <div className="flex items-center gap-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
      </div>
    </div>
  );
}