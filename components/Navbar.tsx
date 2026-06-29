"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === "admin";
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        pathname === href || pathname.startsWith(href + "/")
          ? "text-slate-900 font-medium"
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-semibold text-slate-800 text-base">
            📋 Project Pipeline
          </Link>

          <nav className="flex items-center gap-5">
            {navLink("/", "Dashboard")}
            {navLink("/projects", "Danh sách dự án")}

            {/* Settings dropdown */}
            <div className="relative group">
              <button className={`text-sm transition-colors ${
                pathname.startsWith("/settings")
                  ? "text-slate-900 font-medium"
                  : "text-slate-500 hover:text-slate-900"
              }`}>
                ⚙️ Cài đặt
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-20">
                <Link href="/settings" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Trạng thái dự án
                </Link>
                {isAdmin && (
                  <Link href="/settings/users" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    Quản lý tài khoản
                  </Link>
                )}
              </div>
            </div>

            <Link
              href="/projects/new"
              className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700"
            >
              + Thêm dự án
            </Link>

            {/* User menu */}
            {session && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                    {session.user?.email?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {session.user?.name || session.user?.email}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{session.user?.email}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {isAdmin ? "👑 Admin" : "👤 User"}
                        </div>
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
