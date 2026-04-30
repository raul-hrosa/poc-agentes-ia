"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import type { AuthUser } from "@/features/auth/types"

interface UserMenuProps {
  user: AuthUser
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  async function handleSignOut() {
    await signOut({ redirectTo: "/login" })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="hidden sm:block font-medium text-gray-700">
          {user.name}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
          >
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Meu perfil
              </Link>

              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Configurações
              </Link>

              <hr className="my-1 border-gray-100" />

              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 min-h-[44px]"
              >
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
