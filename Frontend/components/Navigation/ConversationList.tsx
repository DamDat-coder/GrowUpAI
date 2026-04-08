"use client";

import Link from "next/link";
import React, { memo, useState } from "react";
import { ConversationListProps } from "@/types/conversation";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalModal } from "@/contexts/ModalContext";

type PopupType = "rename" | "delete" | null;

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  closeMobileMenu,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { openModal } = useGlobalModal();
  const [popup, setPopup] = useState<{
    type: PopupType;
    id: string;
    title: string;
  } | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const handleConfirmAction = () => {
    if (!popup) return;

    if (popup.type === "rename") {
      console.log("API Gọi Update Title:", popup.id, newTitle);
      // Logic: await api.rename(popup.id, newTitle);
    } else if (popup.type === "delete") {
      console.log("API Gọi Soft Delete:", popup.id);
      // Logic: await api.softDelete(popup.id);
    }

    setPopup(null); // Đóng popup sau khi xong
  };
  const handleOpenDelete = (id: string, title: string) => {
    openModal({
      title: "Xóa cuộc trò chuyện?",
      description: `Bạn có chắc muốn ẩn "${title}"? Dữ liệu vẫn được lưu trữ an toàn.`,
      confirmText: "Xóa ngay",
      type: "danger",
      onConfirm: () => {
        console.log("Xử lý xóa ID:", id);
        // Gọi API xóa ở đây
      },
    });
  };

  const handleOpenRename = (id: string, currentTitle: string) => {
    // Chúng ta có thể truyền cả Input vào Modal
    openModal({
      title: "Đổi tên",
      content: (
        <input
          defaultValue={currentTitle}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e) => ((window as any).tempTitle = e.target.value)} // Lưu tạm title
          className="w-full p-3 rounded-xl bg-gray-100 dark:bg-white/5 outline-none"
        />
      ),
      onConfirm: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const title = (window as any).tempTitle || currentTitle;
        console.log("Cập nhật title mới:", title);
      },
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {sortedConversations.map((conv) => (
        <div key={conv._id} className="relative group">
          <Link
            href={`/chat/${conv._id}`}
            onClick={closeMobileMenu}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all w-full overflow-hidden"
          >
            <span className="truncate flex-1 min-w-0 pr-2">{conv.title}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveMenu(activeMenu === conv._id ? null : conv._id);
              }}
              className="shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md"
            >
              <Ellipsis size={18} className="text-gray-500" />
            </button>
          </Link>

          {/* Menu lựa chọn nhanh */}
          <AnimatePresence>
            {activeMenu === conv._id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#252525] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-20 py-1 overflow-hidden"
              >
                <button
                  onClick={() => handleOpenRename(conv._id, conv.title)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Pencil size={14} /> Sửa tên
                </button>
                <button
                  onClick={() => handleOpenDelete(conv._id, conv.title)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* MODAL POPUP (Sử dụng AnimatePresence để hỗ trợ animation exit) */}
      <AnimatePresence>
        {popup && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 px-4"
            onClick={() => setPopup(null)}
          >
            <motion.div
              key="popup"
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
              onClick={(e) => e.stopPropagation()} // Ngăn đóng khi click vào trong popup
            >
              <h3 className="text-lg font-semibold mb-2">
                {popup.type === "rename"
                  ? "Đổi tên hội thoại"
                  : "Xóa hội thoại?"}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                {popup.type === "rename"
                  ? "Nhập tên mới phù hợp với nội dung cuộc trò chuyện này."
                  : `Hành động này sẽ ẩn "${popup.title}" khỏi danh sách của bạn.`}
              </p>

              {popup.type === "rename" && (
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-[#2a2a2a] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                />
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setPopup(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`px-6 py-2 rounded-xl text-sm font-medium text-white shadow-lg transition-transform active:scale-95 ${
                    popup.type === "delete"
                      ? "bg-red-500 shadow-red-500/20"
                      : "bg-blue-600 shadow-blue-600/20"
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(ConversationList);
