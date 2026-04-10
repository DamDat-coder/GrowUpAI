"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatMessages from "@/components/Home/Chat/ChatMessages";
import ChatInputBox from "@/components/Home/Chat/ChatInputBox";
import { Message } from "@/types/message";
import { getHistory, sendMessage, sendMessageStream } from "@/services/chatApi";
import { useAuth } from "@/contexts/authContext";

export default function ChatDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

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

    // 1. Thêm tin nhắn của User vào trước
    const userMsg: Message = { role: "user", content: text };

    // 2. Thêm luôn một tin nhắn rỗng của Assistant để làm "chỗ ngồi"
    const assistantPlaceholder: Message = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsTyping(true);

    try {
      let fullText = "";
      const userId = user?.id;

      await sendMessageStream(text, userId as string, id as string, (chunk) => {
        fullText += chunk;

        setMessages((prev) => {
          const newMsgs = [...prev];
          // 3. Bây giờ lastIdx chắc chắn là ô của Assistant (vì ta đã thêm ở bước 2)
          const lastIdx = newMsgs.length - 1;
          newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullText };
          return newMsgs;
        });
      });
    } catch (err) {
      console.error("Lỗi gửi stream:", err);
      // Xử lý lỗi nếu cần
    } finally {
      setIsTyping(false);
    }
  };

  const handleEditMessage = async (idx: number, newText: string) => {
    if (!newText.trim()) return;

    // 1. Cắt lịch sử tới message đang edit
    const updatedMessages = messages.slice(0, idx);

    // 2. Thêm lại message user đã sửa
    const newMessages: Message[] = [
      ...updatedMessages,
      { role: "user", content: newText },
    ];

    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await sendMessage(newText, id as string);
      const aiReply =
        response.data.assistantMessage?.message || "AI bận rồi...";

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      console.error("Lỗi edit message:", err);
    } finally {
      setIsTyping(false);
    }
  };
  if (loading) console.log("Đang tải...");

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto h-screen overflow-hidden px-6">
      <div className="flex-1 flex flex-col min-h-0">
        <ChatMessages
          messages={messages}
          isLoading={isTyping}
          onEditMessage={handleEditMessage}
        />
      </div>
      <div className="py-4 w-full">
        <ChatInputBox onSend={handleSendNext} isFirstMessageSent={true} />
      </div>
    </div>
  );
}
