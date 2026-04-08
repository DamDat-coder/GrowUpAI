"use client";

import { User } from "lucide-react";
import { useAuth } from "@/contexts/authContext";

export default function UserBadge() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="laptop:hidden flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50/80 dark:bg-[#2b2b2b] shadow">
      <User size={20} />
      <span className="font-medium">{user.name}</span>
    </div>
  );
}
