"use client";
import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ModalConfig = {
  title: string;
  description?: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  type?: "danger" | "primary";
};

interface ModalContextType {
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const openModal = (c: ModalConfig) => setConfig(c);
  const closeModal = () => setConfig(null);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      
      {/* Cấu trúc Popup dùng Framer Motion render ở đây */}
      <AnimatePresence>
        {config && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">{config.title}</h3>
              {config.description && <p className="text-sm opacity-60 mb-4">{config.description}</p>}
              
              <div className="mb-6">{config.content}</div>

              <div className="flex gap-3 justify-end">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">
                  Hủy
                </button>
                <button
                  onClick={() => { config.onConfirm?.(); closeModal(); }}
                  className={`px-6 py-2 rounded-xl text-white font-medium ${config.type === 'danger' ? 'bg-red-500' : 'bg-emerald-600'}`}
                >
                  {config.confirmText || "Xác nhận"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};

export const useGlobalModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useGlobalModal must be used within ModalProvider");
  return context;
};