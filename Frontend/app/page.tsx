"use client";

import { useState } from "react";
import Sidebar from "@/components/Navigation/Sidebar";
import Header from "@/components/Core/Header";
import Hero from "@/components/Home/Greeting";
import ChatInputBox from "@/components/Home/ChatInputBox";
import { Message } from "@/types/message";
import ChatMessages from "@/components/Home/ChatMessages";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // user message
    const newMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, newMsg]);

    if (!isFirstMessageSent) setIsFirstMessageSent(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Đây là phản hồi demo từ AI." },
      ]);
    }, 600);
  };

  return (
    <main className="w-full h-screen bg-linear-to-br from-white via-blue-50 to-purple-50 relative flex">
      <Header />
      <Sidebar />

      <div className="flex-1 flex flex-col items-center overflow-y-auto pb-20 pt-24 dark:bg-[#1f1f1f]">
        {!isFirstMessageSent && <Hero />}
        {isFirstMessageSent && <ChatMessages messages={messages} />}

        <ChatInputBox onSend={handleSend} isFirstMessageSent={isFirstMessageSent} />
      </div>
    </main>
  );
}
