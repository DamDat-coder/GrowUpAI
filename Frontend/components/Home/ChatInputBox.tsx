"use client";
import { useState } from "react";
import { Paperclip, Mic, Send } from "lucide-react";
import { Plus } from "lucide-react";

export default function ChatInputBox({
  onSend,
  isFirstMessageSent,
}: {
  onSend: (msg: string) => void;
  isFirstMessageSent: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div
      className={`
        w-full max-w-4xl px-6
        transition-all duration-500 ease-in-out
        ${
          isFirstMessageSent
            ? "fixed bottom-8 left-1/2 -translate-x-1/2 z-20"
            : "relative mt-10"
        }
      `}
    >
      <div className="flex items-center gap-3 border border-gray-200 dark:border-white/10 rounded-2xl p-2 bg-white dark:bg-[#2f2f2f] shadow-lg">
        {/* Nút Plus */}
        <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
          <Plus size={20} strokeWidth={1.5} />
        </button>

        {/* Input chính */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Nhập câu lệnh..."
          className="flex-1 bg-transparent py-2 outline-none dark:text-white text-black placeholder:text-gray-400 text-sm"
        />

        {/* Icons bên phải */}
        <div className="flex items-center gap-3 pr-2 shrink-0">
          <Paperclip
            size={18}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          />
          <Mic
            size={18}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          />
        </div>

        {/* Nút gửi */}
        <button
          onClick={handleSubmit}
          className="p-2 rounded-xl bg-[#0E7C45] hover:bg-[#0c6b3b] text-white shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
