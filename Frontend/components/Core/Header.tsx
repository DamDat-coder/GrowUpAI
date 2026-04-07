"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";
import AuthPopup from "./AuthPopup";
import UserMenu from "./UserMenu";
import { useAuth } from "@/contexts/authContext";
import Link from "next/link";

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="hidden tablet:hidden laptop:flex desktop:flex absolute top-4 left-0 right-0 justify-center">
        <Link
          href="/"
          className="flex items-center justify-center p-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]"
        >
          <Image
            src="/Core/logo_light_theme.png"
            width={500}
            height={500}
            alt="logo"
            className="w-[40%] dark:hidden"
          />
          <Image
            src="/Core/logo_dark_theme_v1.png"
            width={500}
            height={500}
            alt="logo"
            className="w-[40%] hidden dark:block"
          />
        </Link>

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
