"use client";

import { useEffect, useState } from "react";
import { COLOR_OPTIONS, COLOR_CLASS_MAP, type StatusItem } from "@/lib/status";

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form thêm mới
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNext, setNewNext] = useState("");
  const [newColor, setNewColor] = useState("gray");
  const [newIsContract, setNewIsContract] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StatusItem>>({});

  function load() {
    setLoading(true);
    fetch("/api/settings/statuses")
      .then((r) => r.json())
      .then((d) => { setStatuses(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function showMsg(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  }

  async function handleAdd() {
    if (!newName.trim()) { showMsg("Tên trạng thái không được để trống.", true); return; }
    setSaving(true);
    const res = await fetch("/api/settings/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        nextStep: newNext.trim() || null,
        color: newColor,
        isContractSigned: newIsContract,
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || "Có lỗi xảy ra.", true); return; }
    setNewName(""); setNewNext(""); setNewColor("gray"); setNewIsContract(false);
    setShowAdd(false);
    showMsg("Đã thêm trạng thái mới.");
    load();
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    const res = await fetch(`/api/settings/statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || "Có lỗi xảy ra.", true); return; }
    setEditingId(null);
    showMsg("Đã lưu thay đổi.");
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa trạng thái "${name}"? Hành động này không thể hoàn tác.`)) return;
    const res = await fetch(`/api/settings/statuses/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || "Có lỗi xảy ra.", true); return; }
    showMsg(`Đã xóa trạng thái "${name}".`);
    load();
  }

  async function handleMoveOrder(id: string, direction: "up" | "down") {
    const idx = statuses.findIndex((s) => s.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === statuses.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = statuses[idx];
    const swap = statuses[swapIdx];

    // Swap orders
    await Promise.all([
      fetch(`/api/settings/statuses/${current.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swap.order }),
      }),
      fetch(`/api/settings/statuses/${swap.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: current.order }),
      }),
    ]);
    load();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Cài đặt trạng thái dự án</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách trạng thái và flow bước kế tiếp. Thay đổi sẽ áp dụng ngay cho toàn bộ hệ thống.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700"
        >
          {showAdd ? "Đóng" : "+ Thêm trạng thái"}
        </button>
      </div>

      {/* Thông báo */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-3 py-2">{success}</div>
      )}

      {/* Form thêm mới */}
      {showAdd && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <h2 className="font-medium text-slate-700 text-sm">Thêm trạng thái mới</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tên trạng thái *">
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Đang thương lượng"
              />
            </Field>
            <Field label="Bước kế tiếp gợi ý">
              <input
                className="input"
                value={newNext}
                onChange={(e) => setNewNext(e.target.value)}
                placeholder="VD: Gửi báo giá"
                list="status-names-list"
              />
            </Field>
            <Field label="Màu badge">
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`px-2 py-0.5 rounded-full text-xs border font-medium transition-all ${COLOR_CLASS_MAP[c]} ${
                      newColor === c ? "ring-2 ring-offset-1 ring-slate-400 scale-105" : "opacity-70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tuỳ chọn">
              <label className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                <input
                  type="checkbox"
                  checked={newIsContract}
                  onChange={(e) => setNewIsContract(e.target.checked)}
                  className="rounded"
                />
                Gợi ý nhập ngày ký hợp đồng khi chuyển sang trạng thái này
              </label>
            </Field>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-slate-800 text-white text-sm px-4 py-1.5 rounded-md hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Thêm trạng thái"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Datalist for autocomplete */}
      <datalist id="status-names-list">
        {statuses.map((s) => <option key={s.id} value={s.name} />)}
      </datalist>

      {/* Danh sách trạng thái */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-medium text-slate-700 text-sm">Danh sách trạng thái</span>
          <span className="text-xs text-slate-400">{statuses.length} trạng thái · Kéo ↕ để sắp xếp thứ tự</span>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-400">Đang tải...</div>
        ) : statuses.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400">Chưa có trạng thái nào.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {statuses.map((s, idx) => (
              <li key={s.id} className="px-4 py-3">
                {editingId === s.id ? (
                  /* ── Edit mode ── */
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Tên trạng thái">
                        <input
                          className="input"
                          value={editData.name ?? s.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </Field>
                      <Field label="Bước kế tiếp gợi ý">
                        <input
                          className="input"
                          value={editData.nextStep ?? s.nextStep ?? ""}
                          onChange={(e) => setEditData({ ...editData, nextStep: e.target.value })}
                          placeholder="Để trống nếu không có"
                          list="status-names-list"
                        />
                      </Field>
                      <Field label="Màu badge">
                        <div className="flex gap-2 flex-wrap">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setEditData({ ...editData, color: c })}
                              className={`px-2 py-0.5 rounded-full text-xs border font-medium transition-all ${COLOR_CLASS_MAP[c]} ${
                                (editData.color ?? s.color) === c
                                  ? "ring-2 ring-offset-1 ring-slate-400 scale-105"
                                  : "opacity-60"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <Field label="Tuỳ chọn">
                        <label className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <input
                            type="checkbox"
                            checked={editData.isContractSigned ?? s.isContractSigned}
                            onChange={(e) => setEditData({ ...editData, isContractSigned: e.target.checked })}
                          />
                          Gợi ý nhập ngày ký hợp đồng
                        </label>
                      </Field>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(s.id!)}
                        disabled={saving}
                        className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md hover:bg-slate-700 disabled:opacity-50"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditData({}); }}
                        className="text-xs text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <div className="flex items-center gap-3">
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMoveOrder(s.id!, "up")}
                        disabled={idx === 0}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveOrder(s.id!, "down")}
                        disabled={idx === statuses.length - 1}
                        className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
                      >
                        ▼
                      </button>
                    </div>

                    <span className="text-xs text-slate-400 w-5 text-center shrink-0">{idx + 1}</span>

                    {/* Badge preview */}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${COLOR_CLASS_MAP[s.color] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                      {s.name}
                    </span>

                    {/* Arrow + next step */}
                    <span className="text-slate-300 text-sm shrink-0">→</span>
                    <span className="text-sm text-slate-600 flex-1">
                      {s.nextStep ? (
                        <span className="font-medium">{s.nextStep}</span>
                      ) : (
                        <span className="text-slate-400 italic">Không có bước kế tiếp</span>
                      )}
                    </span>

                    {/* Contract badge */}
                    {s.isContractSigned && (
                      <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full shrink-0">
                        📝 Gợi ý ngày ký HĐ
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingId(s.id!); setEditData({}); }}
                        className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(s.id!, s.name)}
                        className="text-xs text-red-400 hover:text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Flow preview */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="font-medium text-slate-700 text-sm mb-3">Preview flow trạng thái</div>
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s, idx) => (
            <span key={s.id} className="flex items-center gap-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${COLOR_CLASS_MAP[s.color] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                {s.name}
              </span>
              {s.nextStep && idx < statuses.length - 1 && (
                <span className="text-slate-400 text-sm">→</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          font-family: inherit;
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
