// app/chat/layout.tsx
"use client";
import Header from "@/components/Core/Header";
import Sidebar from "@/components/Navigation/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full h-screen bg-linear-to-br from-white via-blue-50 to-purple-50 relative flex">
      {/* 2 Component này sẽ đứng cố định, không bị load lại khi chuyển trang */}
      <Header />
      <Sidebar />
      
      <div className="px-2 flex-1 flex flex-col items-center overflow-y-auto pb-20 pt-24 bg-gray-50 text-black dark:bg-[#1f1f1f] dark:text-white transition-colors duration-300">
        {children}
      </div>
    </main>
  );
}
