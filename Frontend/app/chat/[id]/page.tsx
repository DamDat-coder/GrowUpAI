"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatMessages from "@/components/Home/ChatMessages";
import ChatInputBox from "@/components/Home/ChatInputBox";
import { Message } from "@/types/message";
import { getHistory, sendMessage } from "@/services/chatApi";

export default function ChatDetailPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Load lịch sử khi vào trang
  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await getHistory(id as string);
        setMessages(history);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error("Không thể load lịch sử");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSendNext = async (text: string) => {
    if (!text.trim()) return;

    // Cập nhật UI tin nhắn user ngay lập tức
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const response = await sendMessage(text, id as string);
      const aiReply =
        response.data.assistantMessage?.message || "AI bận rồi...";

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn tiếp theo:", err);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto h-screen overflow-hidden px-6">
      <div className="flex-1 flex flex-col min-h-0">
        <ChatMessages messages={messages} />
      </div>
      <div className="py-4 w-full">
        <ChatInputBox onSend={handleSendNext} isFirstMessageSent={true} />
      </div>
    </div>
  );
}
