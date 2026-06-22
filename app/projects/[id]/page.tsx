"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatDateTime, toDateInputValue } from "@/lib/format";
import { STATUS_LIST, getSuggestedNextStep, isContractSignedStatus } from "@/lib/status";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  isPrimary: boolean;
  note: string | null;
};

type Note = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type Project = {
  id: string;
  companyName: string;
  projectName: string;
  status: string;
  nextStep: string | null;
  firstContactDate: string;
  contractSignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
  notes: Note[];
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        setProject(d);
        setLoading(false);
      })
      .catch(() => {
        setProject(null);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchProject(data: any) {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((p) => (p ? { ...p, ...updated } : p));
    }
  }

  async function handleDeleteProject() {
    if (!confirm("Bạn có chắc muốn xóa dự án này? Hành động không thể hoàn tác.")) return;
    const res = await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/projects");
  }

  if (loading) return <div className="text-slate-500">Đang tải...</div>;
  if (!project) return <div className="text-red-500">Không tìm thấy dự án.</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {project.companyName} — {project.projectName}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <StatusBadge status={project.status} />
            <span>·</span>
            <span>Bước kế tiếp: {project.nextStep || "—"}</span>
          </div>
        </div>
        <button
          onClick={handleDeleteProject}
          className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50"
        >
          Xóa dự án
        </button>
      </div>

      <ProjectInfoCard project={project} onPatch={patchProject} />

      <div className="grid lg:grid-cols-2 gap-6">
        <ContactsCard project={project} reload={load} />
        <NotesCard project={project} reload={load} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Project info card: editable fields + status / next step logic
// ---------------------------------------------------------------------
function ProjectInfoCard({
  project,
  onPatch,
}: {
  project: Project;
  onPatch: (data: any) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState(project.companyName);
  const [projectName, setProjectName] = useState(project.projectName);
  const [firstContactDate, setFirstContactDate] = useState(
    toDateInputValue(project.firstContactDate)
  );
  const [contractSignedAt, setContractSignedAt] = useState(
    toDateInputValue(project.contractSignedAt)
  );
  const [nextStep, setNextStep] = useState(project.nextStep || "");

  useEffect(() => {
    setCompanyName(project.companyName);
    setProjectName(project.projectName);
    setFirstContactDate(toDateInputValue(project.firstContactDate));
    setContractSignedAt(toDateInputValue(project.contractSignedAt));
    setNextStep(project.nextStep || "");
  }, [project]);

  async function handleStatusChange(status: string) {
    // Auto-update next step according to the status flow.
    const suggested = getSuggestedNextStep(status) || "";
    setNextStep(suggested);

    const data: any = { status, nextStep: suggested };

    // Gợi ý nhập thời gian ký hợp đồng khi chuyển sang "Ký hợp đồng"
    if (isContractSignedStatus(status) && !contractSignedAt) {
      const today = toDateInputValue(new Date());
      setContractSignedAt(today);
      data.contractSignedAt = today;
    }

    await onPatch(data);
  }

  async function handleNextStepBlur() {
    await onPatch({ nextStep });
  }

  async function handleSaveInfo() {
    await onPatch({
      companyName,
      projectName,
      firstContactDate,
      contractSignedAt: contractSignedAt || null,
    });
    setEditing(false);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-700">Thông tin dự án</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-slate-600 hover:underline"
          >
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSaveInfo}
              className="text-sm bg-slate-800 text-white px-3 py-1 rounded-md hover:bg-slate-700"
            >
              Lưu
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-slate-500 px-3 py-1 rounded-md hover:bg-slate-100"
            >
              Hủy
            </button>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Tên công ty">
          {editing ? (
            <input
              className="input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          ) : (
            <div className="text-sm text-slate-800">{project.companyName}</div>
          )}
        </Field>

        <Field label="Tên dự án">
          {editing ? (
            <input
              className="input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          ) : (
            <div className="text-sm text-slate-800">{project.projectName}</div>
          )}
        </Field>

        <Field label="Trạng thái dự án">
          <select
            className="input"
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bước kế tiếp (tự động theo trạng thái, có thể sửa)">
          <input
            className="input"
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            onBlur={handleNextStepBlur}
            placeholder="—"
          />
        </Field>

        <Field label="Thời gian liên hệ lần đầu">
          {editing ? (
            <input
              type="date"
              className="input"
              value={firstContactDate}
              onChange={(e) => setFirstContactDate(e.target.value)}
            />
          ) : (
            <div className="text-sm text-slate-800">
              {formatDate(project.firstContactDate)}
            </div>
          )}
        </Field>

        <Field label="Thời gian ký hợp đồng">
          {editing ? (
            <input
              type="date"
              className="input"
              value={contractSignedAt}
              onChange={(e) => setContractSignedAt(e.target.value)}
            />
          ) : (
            <div className="text-sm text-slate-800">
              {formatDate(project.contractSignedAt)}
            </div>
          )}
        </Field>

        <Field label="Ngày tạo dự án">
          <div className="text-sm text-slate-500">{formatDateTime(project.createdAt)}</div>
        </Field>

        <Field label="Ngày cập nhật gần nhất">
          <div className="text-sm text-slate-500">{formatDateTime(project.updatedAt)}</div>
        </Field>
      </div>

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

// ---------------------------------------------------------------------
// Contacts card
// ---------------------------------------------------------------------
function ContactsCard({ project, reload }: { project: Project; reload: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-slate-700">Người liên hệ</h2>
        <button
          onClick={() => {
            setShowForm((s) => !s);
            setEditingId(null);
          }}
          className="text-sm text-slate-600 hover:underline"
        >
          {showForm ? "Đóng" : "+ Thêm người liên hệ"}
        </button>
      </div>

      {showForm && (
        <ContactForm
          projectId={project.id}
          onDone={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}

      {project.contacts.length === 0 ? (
        <div className="text-sm text-slate-400">Chưa có người liên hệ nào.</div>
      ) : (
        <ul className="space-y-2">
          {project.contacts.map((c) =>
            editingId === c.id ? (
              <li key={c.id}>
                <ContactForm
                  projectId={project.id}
                  contact={c}
                  onDone={() => {
                    setEditingId(null);
                    reload();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={c.id}
                className="border border-slate-100 rounded-md p-3 flex items-start justify-between gap-3"
              >
                <div className="text-sm">
                  <div className="font-medium text-slate-800 flex items-center gap-2">
                    {c.name}
                    {c.isPrimary && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
                        Liên hệ chính
                      </span>
                    )}
                  </div>
                  {c.position && <div className="text-slate-500">{c.position}</div>}
                  <div className="text-slate-600 mt-0.5">
                    {c.phone && <div>📞 {c.phone}</div>}
                    {c.email && <div>✉️ {c.email}</div>}
                  </div>
                  {c.note && (
                    <div className="text-slate-400 italic mt-1">{c.note}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setShowForm(false);
                    }}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Xóa người liên hệ này?")) return;
                      await fetch(
                        `/api/projects/${project.id}/contacts/${c.id}`,
                        { method: "DELETE" }
                      );
                      reload();
                    }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function ContactForm({
  projectId,
  contact,
  onDone,
  onCancel,
}: {
  projectId: string;
  contact?: Contact;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [position, setPosition] = useState(contact?.position || "");
  const [isPrimary, setIsPrimary] = useState(contact?.isPrimary || false);
  const [note, setNote] = useState(contact?.note || "");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Tên người liên hệ là bắt buộc.");
      return;
    }
    const payload = { name, phone, email, position, isPrimary, note };
    const url = contact
      ? `/api/projects/${projectId}/contacts/${contact.id}`
      : `/api/projects/${projectId}/contacts`;
    const method = contact ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) onDone();
    else {
      const d = await res.json();
      setError(d.error || "Có lỗi xảy ra.");
    }
  }

  return (
    <div className="border border-slate-200 rounded-md p-3 space-y-2 bg-slate-50">
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          className="input"
          placeholder="Tên người liên hệ *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Chức vụ"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <input
          className="input"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <textarea
        className="input"
        placeholder="Ghi chú riêng cho người liên hệ"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
        />
        Đánh dấu là người liên hệ chính
      </label>
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="text-sm bg-slate-800 text-white px-3 py-1 rounded-md hover:bg-slate-700"
        >
          {contact ? "Lưu thay đổi" : "Thêm người liên hệ"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-slate-500 px-3 py-1 rounded-md hover:bg-slate-100"
          >
            Hủy
          </button>
        )}
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          background: white;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------
// Notes card
// ---------------------------------------------------------------------
function NotesCard({ project, reload }: { project: Project; reload: () => void }) {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  async function handleAdd() {
    if (!content.trim()) return;
    const res = await fetch(`/api/projects/${project.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setContent("");
      reload();
    }
  }

  async function handleSaveEdit(noteId: string) {
    if (!editingContent.trim()) return;
    const res = await fetch(`/api/projects/${project.id}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editingContent }),
    });
    if (res.ok) {
      setEditingId(null);
      reload();
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Xóa ghi chú này?")) return;
    await fetch(`/api/projects/${project.id}/notes/${noteId}`, {
      method: "DELETE",
    });
    reload();
  }

  // Notes are returned newest-first by the API already.
  const notes = project.notes;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <h2 className="font-medium text-slate-700">Ghi chú dự án</h2>

      <div className="flex gap-2">
        <textarea
          className="input flex-1"
          rows={2}
          placeholder="Thêm ghi chú mới..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="text-sm bg-slate-800 text-white px-3 py-1 rounded-md hover:bg-slate-700 self-start"
        >
          Thêm
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-sm text-slate-400">Chưa có ghi chú nào.</div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="border border-slate-100 rounded-md p-3">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <textarea
                    className="input"
                    rows={2}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(n.id)}
                      className="text-xs bg-slate-800 text-white px-2 py-1 rounded-md hover:bg-slate-700"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-slate-500 px-2 py-1 rounded-md hover:bg-slate-100"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap">
                    {n.content}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-slate-400">
                      Tạo: {formatDateTime(n.createdAt)}
                      {n.updatedAt !== n.createdAt && (
                        <> · Sửa: {formatDateTime(n.updatedAt)}</>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(n.id);
                          setEditingContent(n.content);
                        }}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

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
