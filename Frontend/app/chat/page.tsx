"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Greeting from "@/components/Home/Style/Greeting";
import ChatInputBox from "@/components/Home/Chat/ChatInputBox";
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
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto h-screen overflow-hidden px-6 items-center">
      <Greeting />
      <div className="py-4 w-full">
        <ChatInputBox
          onSend={handleSendFirstMessage}
          isFirstMessageSent={false}
        />
      </div>
    </div>
  );
}
