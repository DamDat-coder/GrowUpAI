import { Message } from "@/types/message";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export default function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar pt-10 px-4 scroll-hidden">
      <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-20">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";

          return (
            <div
              key={idx}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start border-t border-gray-100 dark:border-white/5 pt-6"}`}
            >
              <div
                className={`text-sm leading-7 ${
                  isUser
                    ? "p-4 rounded-2xl shadow-sm max-w-[85%] bg-linear-to-r from-blue-600 to-purple-600 text-white whitespace-pre-wrap"
                    : "w-full text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                }`}
              >
                {/* Nếu không dùng thư viện Markdown, dùng whitespace-pre-wrap là đủ để xuống dòng */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
