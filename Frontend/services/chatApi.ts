import { Message } from "@/types/message";
import { apiFetch } from "./api";
import { BackendMessage, SendMessageResponse } from "@/types/chat";

export async function sendMessage(
  message: string,
  conversationId?: string,
): Promise<SendMessageResponse> {
  if (!message || typeof message !== "string") {
    throw new Error("message is required and must be a string");
  }

  const endpoint = conversationId ? `/chat/${conversationId}` : `/chat`;

  const res = await apiFetch<SendMessageResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify({ message, conversationId }),
  });

  return res;
}

export async function sendMessageToConversation(
  conversationId: string | undefined,
  message: string,
): Promise<SendMessageResponse> {
  return sendMessage(message, conversationId);
}

export async function getHistory(conversationId: string): Promise<Message[]> {
  if (!conversationId) {
    throw new Error("conversationId is required");
  }
  console.log("Gọi getHistory");

  // Gọi API tới Node.js Backend
  const res = await apiFetch<{ success: boolean; data: BackendMessage[] }>(
    `/chat/${conversationId}`,
    { method: "GET" },
  );
  console.log(res);

  // Nếu Backend trả về thành công, map nó sang đúng định dạng Message của FE
  if (res.success && Array.isArray(res.data)) {
    return res.data.map((item) => ({
      role: item.sender === "user" ? "user" : "assistant",
      content: item.message,
    }));
  }

  return [];
}

// services/chatApi.ts

export async function sendMessageStream(
  message: string,
  userId: string,
  conversationId: string,
  onChunk: (text: string) => void,
) {
  console.log("message: ", message);
  console.log("userId: ", userId);
  console.log("conversationId: ", conversationId);
  const safeConvId = (conversationId && conversationId !== "new") ? conversationId : "";

  const response = await fetch("http://localhost:8000/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      message: message,
      conversationId: safeConvId,
    }),
  });
  console.log("response: ", response);

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullAnswer = "";

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          fullAnswer += parsed.text;
          onChunk(parsed.text); // Cập nhật UI ngay lập tức
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}
      }
    }
  }
  return fullAnswer; // Trả về để sau đó lưu vào DB
}
