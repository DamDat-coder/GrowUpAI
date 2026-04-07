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
    <main className="w-full h-screen relative flex overflow-hidden">
      <Header />
      <Sidebar />

      <div className="flex-1 flex flex-col items-stretch py-16 bg-gray-50 text-black dark:bg-[#1f1f1f] dark:text-white transition-colors duration-300">
        {children}
      </div>
    </main>
  );
}
