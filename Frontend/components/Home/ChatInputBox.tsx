"use client";
import { useState } from "react";
import { Paperclip, Mic, Send } from "lucide-react";

export default function ChatInputBox({
  onSend,
  isFirstMessageSent,
}: {
  onSend: (msg: string) => void;
  isFirstMessageSent: boolean;
}) {
  const [input, setInput] = useState("");
  const suggestions = ["Làm việc với file", "Phản biện"];

  const handleSubmit = () => {
    if (!input.trim()) return;

    onSend(input);
    setInput("");
  };

  return (
    <div
      className={`
        w-full max-w-3xl mx-auto flex flex-col items-center gap-3 
        transition-all duration-500 
        ${isFirstMessageSent ? "translate-y-2" : "translate-y-0"}
      `}
      style={{
        position: isFirstMessageSent ? "absolute" : "relative",
        bottom: isFirstMessageSent ? "2rem" : "auto",
      }}
    >
      <div className="w-full bg-white shadow-lg rounded-3xl p-4 border border-gray-200  dark:bg-[#252525]">
        <div className="flex items-center gap-3 border rounded-2xl p-3 bg-gray-50  dark:bg-[#252525]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Nhập câu lệnh"
            className="flex-1 bg-transparent outline-none dark:text-white text-black"
          />

          <Paperclip size={20} className="text-gray-500" />
          <Mic size={20} className="text-gray-600" />

          <button
            onClick={handleSubmit}
            className="p-2 rounded-xl bg-linear-to-r from-blue-500 to-purple-500 text-white shadow"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap dark:text-black">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="bg-gray-100 px-3 py-1 rounded-full text-sm shadow-sm dark:bg-[#252525] border dark:border-gray-200 dark:text-white cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
