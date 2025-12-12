// components/Sidebar/ConversationList.tsx
"use client";

import Link from "next/link";
import React, { memo } from "react";
import { ConversationListProps } from "@/types/conversation";
import { MessagesSquare } from "lucide-react";
/**
 * Hiển thị danh sách các hội thoại đã lưu.
 * Áp dụng memo để tránh re-render không cần thiết.
 */
const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  closeMobileMenu,
}) => {
  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <>
      {sortedConversations.length > 0 &&
        sortedConversations.map((conv) => (
          <Link
            key={conv._id}
            href={`/chat/${conv._id}`}
            onClick={closeMobileMenu}
            className="
              flex items-center gap-3 pl-12 pr-3 py-2 rounded-xl text-sm
              hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white
              transition-all duration-150 whitespace-nowrap overflow-hidden text-ellipsis
            "
            title={conv.title}
          >
            {/* Thêm một chút biểu tượng để làm nổi bật */}
            <MessagesSquare size={16} className="text-gray-400 min-w-4" />
            <span className="truncate">{conv.title}</span>
          </Link>
        ))}
    </>
  );
};

export default memo(ConversationList);
