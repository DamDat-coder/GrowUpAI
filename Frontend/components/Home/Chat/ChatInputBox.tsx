"use client";
import { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Send, Plus } from "lucide-react";

export default function ChatInputBox({
  onSend,
  isFirstMessageSent,
}: {
  onSend: (msg: string) => void;
  isFirstMessageSent: boolean;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự động điều chỉnh chiều cao của textarea khi nội dung thay đổi
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height để tính toán lại
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Giới hạn tối đa 200px
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
    // Reset lại chiều cao về mặc định sau khi gửi
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Gửi tin nhắn khi nhấn Enter (không kèm Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Nếu nhấn Shift + Enter, textarea sẽ tự động xuống dòng mặc định
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
      <div className="flex items-end gap-3 border border-gray-200 dark:border-white/10 rounded-2xl p-2 bg-white dark:bg-[#2f2f2f] shadow-lg">
        {/* Nút Plus - Căn dưới (items-end) để đẹp khi textarea cao lên */}
        <button className="flex items-center justify-center w-8 h-8 mb-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
          <Plus size={20} strokeWidth={1.5} />
        </button>

        {/* Textarea chính */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu lệnh..."
          className="flex-1 bg-transparent py-2 resize-none outline-none dark:text-white text-black placeholder:text-gray-400 text-sm min-h-10 max-h-[200px] scroll-hidden"
          style={{ lineHeight: "1.5" }}
        />

        {/* Icons bên phải */}
        <div className="flex items-center gap-3 pr-2 mb-2 shrink-0">
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
          disabled={!input.trim()}
          className={`p-2 mb-1 rounded-xl shadow-sm transition-all active:scale-95 shrink-0
            ${input.trim() 
              ? "bg-[#0E7C45] hover:bg-[#0c6b3b] text-white opacity-100" 
              : "bg-gray-100 dark:bg-white/5 text-gray-400 opacity-50 cursor-not-allowed"}
          `}
        >
          <Send size={18} />
        </button>
      </div>
      
      {/* Gợi ý nhỏ bên dưới (tùy chọn) */}
      <p className="text-[10px] text-center text-gray-400 mt-2">
        Nhấn <b>Enter</b> để gửi, <b>Shift + Enter</b> để xuống dòng
      </p>
    </div>
  );
}