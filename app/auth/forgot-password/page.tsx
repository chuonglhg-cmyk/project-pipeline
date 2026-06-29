"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">📋</div>
          <h1 className="text-xl font-semibold text-slate-800">Project Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Đặt lại mật khẩu</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center space-y-3">
              <div className="text-3xl">📧</div>
              <p className="font-medium text-slate-800">Kiểm tra email của bạn!</p>
              <p className="text-sm text-slate-500">
                Nếu email <strong>{email}</strong> tồn tại trong hệ thống,
                bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
              </p>
              <Link
                href="/auth/login"
                className="block text-sm text-slate-600 hover:underline mt-4"
              >
                ← Quay về đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-600">
                Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-800 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="text-xs text-slate-500 hover:underline">
                  ← Quay về đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
