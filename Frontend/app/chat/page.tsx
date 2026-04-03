"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Hero from "@/components/Home/Greeting";
import ChatInputBox from "@/components/Home/ChatInputBox";
import { sendMessage } from "@/services/chatApi";

export default function ChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSendFirstMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    try {
      setLoading(true);
      const response = await sendMessage(text);
      const newConvId = response.data.conversationId;
      router.push(`/chat/${newConvId}`);
    } catch (err) {
      console.error("Lỗi khởi tạo chat:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Hero />
      <ChatInputBox onSend={handleSendFirstMessage} isFirstMessageSent={false} />
    </>
  );
}