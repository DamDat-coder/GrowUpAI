"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";
import AuthPopup from "./AuthPopup";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/authContext";

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="hidden tablet:hidden laptop:flex desktop:flex absolute top-4 left-0 right-0 justify-center">
        {/* Logo */}
        <div className="flex w-fit items-center justify-center gap-3 px-6 py-2 bg-gray-50/70 dark:bg-[#252525] backdrop-blur-md rounded-full shadow-sm font-semibold border border-gray-100">
          <div className="p-1 rounded-lg">
            <Image
              src="/Core/logo.png"
              width={50}
              height={50}
              alt="logo"
              className="p-1 rounded-lg dark:hidden"
            />
            <Image
              src="/Core/logo_dark_theme.png"
              width={50}
              height={50}
              alt="logo"
              className="p-1 rounded-lg hidden dark:block"
            />
          </div>
          GrowUp AI
        </div>

        {/* USER AREA */}
        <div
          className="absolute right-6"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {!user ? (
            <button
              onClick={() => setShowAuth(true)}
              className="p-2 rounded-full shadow transition hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200"
            >
              <User size={20} />
            </button>
          ) : (
            <UserMenu show={showMenu} />
          )}
        </div>
      </header>

      {/* Auth Popup */}
      <AuthPopup
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />
    </>
  );
}
