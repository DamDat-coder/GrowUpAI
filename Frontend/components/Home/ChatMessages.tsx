import { Message } from "@/types/message";


export default function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="w-full h-[90vh] overflow-scroll pb-10 max-w-3xl mx-auto flex flex-col gap-4 scroll-hidden">
      {messages.map((m, idx) => (
        <div
          key={idx}
          className={`p-3 rounded-2xl shadow-sm max-w-[80%] ${
            m.role === "user"
              ? "self-end bg-linear-to-r from-blue-500 to-purple-500 text-white"
              : "self-start bg-gray-100 text-gray-800"
          }`}
        >
          {m.content}
        </div>
      ))}
    </div>
  );
}
