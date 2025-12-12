"use client";

import { useState } from "react";
import Sidebar from "@/components/Navigation/Sidebar";
import Header from "@/components/Core/Header";
import Hero from "@/components/Home/Greeting";
import ChatInputBox from "@/components/Home/ChatInputBox";
import { Message } from "@/types/message";
import ChatMessages from "@/components/Home/ChatMessages";
import { sendMessage } from "@/services/chatApi";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);

  // ⭐ Lưu conversationId để gửi tiếp các tin nhắn sau
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1️⃣ UI: thêm tin nhắn user trước
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    if (!isFirstMessageSent) setIsFirstMessageSent(true);

    try {
      // 2️⃣ Gửi API chính xác
      const response = await sendMessage(text, conversationId ?? undefined);

      const newConvId = response.data.conversationId;

      // ⭐ Lưu conversationId để dùng cho các request tiếp theo
      if (!conversationId) setConversationId(newConvId);

      // 3️⃣ Lấy AI trả lời từ backend
      const aiReply =
        response.data.assistantMessage?.message ||
        "AI không gửi phản hồi.";

      const botMsg: Message = { role: "ai", content: aiReply };

      // 4️⃣ Cập nhật UI
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Gửi tin nhắn lỗi:", err);

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Lỗi: không thể gửi tin nhắn" },
      ]);
    }
  };

  return (
    <main className="w-full h-screen bg-linear-to-br from-white via-blue-50 to-purple-50 relative flex">
      <Header />
      <Sidebar />

      <div className="px-2 flex-1 flex flex-col items-center overflow-y-auto pb-20 pt-24 dark:bg-[#1f1f1f]">
        {!isFirstMessageSent && <Hero />}
        {isFirstMessageSent && <ChatMessages messages={messages} />}

        <ChatInputBox
          onSend={handleSend}
          isFirstMessageSent={isFirstMessageSent}
        />
      </div>
    </main>
  );
}
