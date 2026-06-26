"use client";

import { useEffect, useState, useRef } from "react";
import { COLOR_OPTIONS, COLOR_CLASS_MAP, type StatusItem } from "@/lib/status";

// Label tiếng Việt cho màu
const COLOR_LABELS: Record<string, string> = {
  gray: "Xám", blue: "Xanh dương", yellow: "Vàng", purple: "Tím",
  green: "Xanh lá", red: "Đỏ", slate: "Đen xám", orange: "Cam", teal: "Xanh ngọc",
};

const EMPTY_FORM = { name: "", nextStep: "", color: "gray", isContractSigned: false };

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form thêm mới
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });

  // ── Load ──────────────────────────────────────────────────────
  function load() {
    setLoading(true);
    fetch("/api/settings/statuses")
      .then((r) => r.json())
      .then((d) => { setStatuses(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  // Focus input khi mở form thêm
  useEffect(() => {
    if (showAdd) setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [showAdd]);

  function flash(text: string, type: "success" | "error" = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  }

  // ── Thêm trạng thái mới ───────────────────────────────────────
  async function handleAdd() {
    if (!addForm.name.trim()) { flash("Tên trạng thái không được để trống.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          nextStep: addForm.nextStep.trim() || null,
          color: addForm.color,
          isContractSigned: addForm.isContractSigned,
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error || "Lưu thất bại.", "error"); return; }
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
      flash(`Đã thêm trạng thái "${data.name}".`);
      load();
    } catch (e) {
      flash("Lỗi kết nối. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Mở form sửa ───────────────────────────────────────────────
  function startEdit(s: StatusItem) {
    setEditingId(s.id!);
    setEditForm({
      name: s.name,
      nextStep: s.nextStep || "",
      color: s.color,
      isContractSigned: s.isContractSigned,
    });
    setShowAdd(false);
  }

  // ── Lưu sửa ───────────────────────────────────────────────────
  async function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) { flash("Tên trạng thái không được để trống.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/statuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          nextStep: editForm.nextStep.trim() || null,
          color: editForm.color,
          isContractSigned: editForm.isContractSigned,
        }),
      });
      const data = await res.json();
      if (!res.ok) { flash(data.error || "Lưu thất bại.", "error"); return; }
      setEditingId(null);
      flash("Đã lưu thay đổi.");
      load();
    } catch (e) {
      flash("Lỗi kết nối. Vui lòng thử lại.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Xóa ───────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa trạng thái "${name}"?\nHành động này không thể hoàn tác.`)) return;
    try {
      const res = await fetch(`/api/settings/statuses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { flash(data.error, "error"); return; }
      flash(`Đã xóa trạng thái "${name}".`);
      load();
    } catch (e) {
      flash("Lỗi kết nối.", "error");
    }
  }

  // ── Đổi thứ tự ────────────────────────────────────────────────
  async function handleMove(id: string, dir: "up" | "down") {
    const idx = statuses.findIndex((s) => s.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === statuses.length - 1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const cur = statuses[idx];
    const swp = statuses[swapIdx];

    // Optimistic update UI trước
    const newList = [...statuses];
    newList[idx] = { ...swp, order: cur.order };
    newList[swapIdx] = { ...cur, order: swp.order };
    setStatuses(newList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

    try {
      await Promise.all([
        fetch(`/api/settings/statuses/${cur.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: swp.order }),
        }),
        fetch(`/api/settings/statuses/${swp.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: cur.order }),
        }),
      ]);
    } catch {
      load(); // rollback nếu lỗi
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Cài đặt trạng thái dự án</h1>
          <p className="text-sm text-slate-500 mt-1">
            Thêm/sửa/xóa trạng thái và cấu hình flow bước kế tiếp.
            Thay đổi áp dụng ngay cho toàn bộ hệ thống.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setEditingId(null); }}
          className="shrink-0 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700"
        >
          {showAdd ? "✕ Đóng" : "+ Thêm trạng thái"}
        </button>
      </div>

      {/* Toast thông báo */}
      {msg && (
        <div className={`text-sm rounded-md px-3 py-2 border ${
          msg.type === "error"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {msg.type === "error" ? "⚠️ " : "✅ "}{msg.text}
        </div>
      )}

      {/* Form thêm mới */}
      {showAdd && (
        <div className="bg-white border-2 border-slate-800 rounded-lg p-4 space-y-4">
          <h2 className="font-medium text-slate-800 text-sm">✦ Thêm trạng thái mới</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tên trạng thái *">
              <input
                ref={nameInputRef}
                className="input"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="VD: Đang thương lượng"
              />
            </Field>

            <Field label="Bước kế tiếp gợi ý">
              <input
                className="input"
                value={addForm.nextStep}
                onChange={(e) => setAddForm({ ...addForm, nextStep: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="VD: Gửi báo giá (để trống nếu không có)"
                list="status-names-datalist"
              />
            </Field>
          </div>

          <Field label="Màu badge">
            <ColorPicker value={addForm.color} onChange={(c) => setAddForm({ ...addForm, color: c })} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={addForm.isContractSigned}
              onChange={(e) => setAddForm({ ...addForm, isContractSigned: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span>Gợi ý nhập <strong>ngày ký hợp đồng</strong> khi dự án chuyển sang trạng thái này</span>
          </label>

          <div className="flex gap-2 pt-1 border-t border-slate-100">
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

      {/* Datalist autocomplete cho "bước kế tiếp" */}
      <datalist id="status-names-datalist">
        {statuses.map((s) => <option key={s.id} value={s.name} />)}
      </datalist>

      {/* Danh sách trạng thái */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="font-medium text-slate-700 text-sm">
            Danh sách trạng thái
          </span>
          <span className="text-xs text-slate-400">{statuses.length} trạng thái</span>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-slate-400 text-center">Đang tải...</div>
        ) : statuses.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-400 text-center">
            Chưa có trạng thái nào.{" "}
            <button onClick={() => setShowAdd(true)} className="text-slate-800 underline">Thêm ngay</button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {statuses.map((s, idx) => (
              <li key={s.id} className={`px-4 py-3 ${editingId === s.id ? "bg-slate-50" : ""}`}>

                {editingId === s.id ? (
                  /* ── Edit mode ── */
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-slate-500 mb-2">Đang chỉnh sửa trạng thái</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Tên trạng thái *">
                        <input
                          className="input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(s.id!)}
                          autoFocus
                        />
                      </Field>
                      <Field label="Bước kế tiếp gợi ý">
                        <input
                          className="input"
                          value={editForm.nextStep}
                          onChange={(e) => setEditForm({ ...editForm, nextStep: e.target.value })}
                          placeholder="Để trống nếu không có"
                          list="status-names-datalist"
                        />
                      </Field>
                    </div>
                    <Field label="Màu badge">
                      <ColorPicker value={editForm.color} onChange={(c) => setEditForm({ ...editForm, color: c })} />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isContractSigned}
                        onChange={(e) => setEditForm({ ...editForm, isContractSigned: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Gợi ý nhập ngày ký hợp đồng khi chuyển sang trạng thái này
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(s.id!)}
                        disabled={saving}
                        className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md hover:bg-slate-700 disabled:opacity-50"
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-slate-500 px-3 py-1.5 rounded-md hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>

                ) : (
                  /* ── View mode ── */
                  <div className="flex items-center gap-3">
                    {/* Nút sắp xếp */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => handleMove(s.id!, "up")}
                        disabled={idx === 0}
                        title="Lên"
                        className="text-slate-300 hover:text-slate-700 disabled:opacity-20 text-xs leading-tight"
                      >▲</button>
                      <button
                        onClick={() => handleMove(s.id!, "down")}
                        disabled={idx === statuses.length - 1}
                        title="Xuống"
                        className="text-slate-300 hover:text-slate-700 disabled:opacity-20 text-xs leading-tight"
                      >▼</button>
                    </div>

                    {/* Số thứ tự */}
                    <span className="text-xs text-slate-300 w-4 text-right shrink-0">{idx + 1}</span>

                    {/* Badge */}
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${
                      COLOR_CLASS_MAP[s.color] || COLOR_CLASS_MAP["gray"]
                    }`}>
                      {s.name}
                    </span>

                    {/* Flow arrow */}
                    <span className="text-slate-300 text-sm shrink-0">→</span>

                    {/* Next step */}
                    <span className="text-sm flex-1 min-w-0">
                      {s.nextStep
                        ? <span className="text-slate-700 font-medium">{s.nextStep}</span>
                        : <span className="text-slate-300 italic text-xs">Không có bước kế tiếp</span>
                      }
                    </span>

                    {/* Contract flag */}
                    {s.isContractSigned && (
                      <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        📋 Ngày ký HĐ
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 shrink-0 ml-2">
                      <button
                        onClick={() => startEdit(s)}
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

      {/* Preview flow */}
      {statuses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Preview flow
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((s, idx) => (
              <span key={s.id} className="flex items-center gap-2">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                  COLOR_CLASS_MAP[s.color] || COLOR_CLASS_MAP["gray"]
                }`}>
                  {s.name}
                </span>
                {idx < statuses.length - 1 && (
                  <span className="text-slate-300 text-sm">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.875rem;
          font-family: inherit;
          background: white;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #94a3b8;
          box-shadow: 0 0 0 2px rgba(148,163,184,0.2);
        }
      `}</style>
    </div>
  );
}

// ── ColorPicker component ─────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          title={COLOR_LABELS[c] || c}
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${
            COLOR_CLASS_MAP[c]
          } ${
            value === c
              ? "ring-2 ring-offset-1 ring-slate-600 scale-110 shadow-sm"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          {COLOR_LABELS[c] || c}
        </button>
      ))}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}
