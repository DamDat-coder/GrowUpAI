import { Message } from "@/types/message";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Copy, Check, Pencil } from "lucide-react";
import TypingMarkdown from "../Style/TypingMarkDown";

interface ChatMessageItemProps {
  message: Message;
  index: number;
  isLast: boolean;
  editingIdx: number | null;
  editText: string;
  copiedIdx: number | null;
  onEdit: (idx: number, text: string) => void;
  onSave: (idx: number) => void;
  onCancelEdit: () => void;
  onCopy: (text: string, idx: number) => void;
  onSetEditText: (text: string) => void;
}

export default function ChatMessageItem({
  message,
  index,
  isLast,
  editingIdx,
  editText,
  copiedIdx,
  onEdit,
  onSave,
  onCancelEdit,
  onCopy,
  onSetEditText,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const hasCode = message.content.includes("```");
  const isEditing = editingIdx === index;

  return (
    <div
      className={`flex w-full ${
        isUser
          ? "justify-end"
          : "justify-start border-t border-gray-100 dark:border-white/5 pt-6"
      }`}
    >
      <div className="relative group max-w-[90%] md:max-w-[85%]">
        <div
          className={`text-sm leading-7 ${
            isUser
              ? "p-3 md:p-4 rounded-2xl shadow-sm bg-[#109150] text-white"
              : "w-full text-gray-800 dark:text-gray-200"
          } whitespace-pre-wrap`}
        >
          {isUser && isEditing ? (
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => onSetEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSave(index);
                }
                if (e.key === "Escape") onCancelEdit();
              }}
              className="w-full min-w-[200px] md:min-w-[400px] bg-transparent outline-none resize-none"
            />
          ) : isUser ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          ) : isLast ? (
            <TypingMarkdown text={message.content} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          )}
        </div>

        {/* Action Buttons: Tự động responsive nhờ group-hover và kích thước icon */}
        <div className="absolute -bottom-8 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUser && (
            <button
              onClick={() => onEdit(index, message.content)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Pencil size={14} className="md:w-4 md:h-4" />
            </button>
          )}
          {(isUser || hasCode) && (
            <button
              onClick={() => onCopy(message.content, index)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {copiedIdx === index ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}