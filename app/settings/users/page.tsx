"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  emailVerified: string | null;
  pendingInvite: { expiresAt: string; createdAt: string } | null;
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form mời user mới
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  // Redirect nếu không phải admin
  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  function load() {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function flash(text: string, type: "success" | "error" = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim() || undefined,
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error || "Có lỗi xảy ra.", "error"); return; }
      flash(`✉️ Đã gửi email mời tạo mật khẩu đến ${inviteEmail}.`);
      setInviteEmail(""); setInviteName(""); setInviteRole("user");
      setShowInvite(false);
      load();
    } catch {
      flash("Lỗi kết nối.", "error");
    } finally {
      setInviting(false);
    }
  }

  async function handleResendInvite(email: string) {
    setInviting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error, "error"); return; }
      flash(`✉️ Đã gửi lại email mời đến ${email}.`);
      load();
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) { flash("Đã cập nhật quyền."); load(); }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Xóa tài khoản "${email}"? Hành động không thể hoàn tác.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { flash(data.error, "error"); return; }
    flash(`Đã xóa tài khoản ${email}.`);
    load();
  }

  const isAdmin = (session?.user as any)?.role === "admin";
  const currentUserId = (session?.user as any)?.id;

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Quản lý tài khoản</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo và quản lý tài khoản đăng nhập. Link tạo mật khẩu sẽ được gửi qua email.
          </p>
        </div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="shrink-0 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700"
        >
          {showInvite ? "✕ Đóng" : "+ Tạo tài khoản"}
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`text-sm rounded-md px-3 py-2 border ${
          msg.type === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Form tạo tài khoản mới */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="bg-white border-2 border-slate-800 rounded-lg p-5 space-y-4"
        >
          <h2 className="font-medium text-slate-800 text-sm">✦ Tạo tài khoản mới</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Email *</label>
              <input
                type="email"
                className="input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Họ tên</label>
              <input
                className="input"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">Quyền hạn</label>
              <select
                className="input"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="user">User — Dùng thông thường</option>
                <option value="admin">Admin — Quản lý tài khoản</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs text-blue-700">
            📧 Hệ thống sẽ gửi email đến <strong>{inviteEmail || "địa chỉ email"}</strong> với link tạo mật khẩu.
            Link có hiệu lực trong <strong>24 giờ</strong>.
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={inviting}
              className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded-md hover:bg-slate-700 disabled:opacity-50"
            >
              {inviting ? "Đang gửi..." : "Tạo & gửi email mời"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="text-sm text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Danh sách users */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-medium text-slate-700 text-sm">Danh sách tài khoản</span>
          <span className="text-xs text-slate-400">{users.length} tài khoản</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-slate-400 text-center">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-400 text-center">Chưa có tài khoản nào.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Họ tên</th>
                <th className="px-4 py-2 font-medium">Quyền</th>
                <th className="px-4 py-2 font-medium">Trạng thái</th>
                <th className="px-4 py-2 font-medium">Ngày tạo</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrentUser = u.id === currentUserId;
                const isActivated = !!u.emailVerified;
                const hasPendingInvite = !!u.pendingInvite;

                return (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{u.email}</div>
                      {isCurrentUser && (
                        <span className="text-xs text-slate-400">(Tài khoản của bạn)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.name || "—"}</td>
                    <td className="px-4 py-3">
                      {isCurrentUser ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs border font-medium ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}>
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-md px-2 py-0.5 bg-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isActivated ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          ✓ Đã kích hoạt
                        </span>
                      ) : hasPendingInvite ? (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                          ⏳ Chờ tạo mật khẩu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          — Chưa kích hoạt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {!isActivated && (
                          <button
                            onClick={() => handleResendInvite(u.email)}
                            disabled={inviting}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            Gửi lại email
                          </button>
                        )}
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.875rem;
          font-family: inherit;
          background: white;
        }
        .input:focus { border-color: #94a3b8; outline: none; }
      `}</style>
    </div>
  );
}
