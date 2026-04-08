"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";
import AuthPopup from "../Auth/AuthPopup";
import UserMenu from "../Auth/UserMenu";
import { useAuth } from "@/contexts/authContext";
import Link from "next/link";

export default function Header() {
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="flex items-center absolute top-6 left-0 right-0">
        <Link href="/" className=" flex items-center translate-x-16 laptop:translate-x-24">
          <Image
            src="/Core/logo_light_theme.svg"
            width={100}
            height={100}
            alt="logo"
            className=" dark:hidden"
          />
          <Image
            src="/Core/logo_dark_theme_v1.svg"
            width={100}
            height={100}
            alt="logo"
            className=" hidden dark:block"
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
