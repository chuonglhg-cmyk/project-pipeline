"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStatuses } from "@/lib/useStatuses";

export default function NewProjectPage() {
  const router = useRouter();
  const { statuses, getNextStep } = useStatuses();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    projectName: "",
    status: "New",
    nextStep: "Demo",
    firstContactDate: new Date().toISOString().slice(0, 10),
    contractSignedAt: "",
  });

  // Khi statuses load xong, cập nhật nextStep theo status hiện tại
  function handleStatusChange(status: string) {
    setForm((f) => ({
      ...f,
      status,
      nextStep: getNextStep(status) || "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.companyName.trim() || !form.projectName.trim()) {
      setError("Vui lòng nhập tên công ty và tên dự án.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contractSignedAt: form.contractSignedAt || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Có lỗi xảy ra.");
      setSubmitting(false);
      return;
    }
    const created = await res.json();
    router.push(`/projects/${created.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">Thêm dự án mới</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tên công ty *">
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="input"
              placeholder="VD: Công ty A"
            />
          </Field>
          <Field label="Tên dự án *">
            <input
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              className="input"
              placeholder="VD: Website thương mại điện tử"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Trạng thái dự án">
            <select
              value={form.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input"
            >
              {statuses.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Bước kế tiếp (tự động, có thể chỉnh tay)">
            <input
              value={form.nextStep}
              onChange={(e) => setForm({ ...form, nextStep: e.target.value })}
              className="input"
              placeholder="VD: Demo"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Thời gian liên hệ lần đầu *">
            <input
              type="date"
              value={form.firstContactDate}
              onChange={(e) => setForm({ ...form, firstContactDate: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Thời gian ký hợp đồng (nếu có)">
            <input
              type="date"
              value={form.contractSignedAt}
              onChange={(e) => setForm({ ...form, contractSignedAt: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Tạo dự án"}
          </button>
        </div>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
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
