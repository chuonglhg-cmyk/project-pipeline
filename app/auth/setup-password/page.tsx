"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SetupPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const isReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done">("loading");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Kiểm tra token hợp lệ
  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`/api/auth/setup-password?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) { setEmail(d.email); setStatus("valid"); }
        else { setError(d.error || "Token không hợp lệ."); setStatus("invalid"); }
      })
      .catch(() => { setError("Có lỗi xảy ra."); setStatus("invalid"); });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }

    setSubmitting(true);
    const res = await fetch("/api/auth/setup-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error || "Có lỗi xảy ra."); return; }
    setStatus("done");
    setTimeout(() => router.push("/auth/login?setup=success"), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">📋</div>
          <h1 className="text-xl font-semibold text-slate-800">Project Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isReset ? "Đặt lại mật khẩu" : "Tạo mật khẩu"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {status === "loading" && (
            <div className="text-sm text-slate-400 text-center py-4">Đang kiểm tra...</div>
          )}

          {status === "invalid" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                ⚠️ {error || "Link không hợp lệ hoặc đã hết hạn."}
              </div>
              <p className="text-sm text-slate-500 text-center">
                Vui lòng liên hệ admin để được gửi link mới.
              </p>
            </div>
          )}

          {status === "done" && (
            <div className="text-center space-y-2">
              <div className="text-3xl">✅</div>
              <p className="font-medium text-slate-800">Mật khẩu đã được {isReset ? "đặt lại" : "tạo"} thành công!</p>
              <p className="text-sm text-slate-500">Đang chuyển về trang đăng nhập...</p>
            </div>
          )}

          {status === "valid" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-slate-50 rounded-md px-3 py-2 text-sm text-slate-600">
                Tài khoản: <strong>{email}</strong>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-800 text-white py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : isReset ? "Đặt lại mật khẩu" : "Tạo mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
