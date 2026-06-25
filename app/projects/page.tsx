"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/format";
import { useStatuses } from "@/lib/useStatuses";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};

type Project = {
  id: string;
  companyName: string;
  projectName: string;
  status: string;
  nextStep: string | null;
  firstContactDate: string;
  contractSignedAt: string | null;
  updatedAt: string;
  contacts: Contact[];
};

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Ngày cập nhật gần nhất" },
  { value: "firstContactDate", label: "Thời gian liên hệ lần đầu" },
  { value: "contractSignedAt", label: "Thời gian ký hợp đồng" },
];

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { statuses } = useStatuses();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);

    fetch(`/api/projects?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setProjects(d);
        setLoading(false);
      });
  }, [search, status, sortBy, sortDir]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Xuất báo cáo Excel — truyền thêm filter đang dùng
  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await fetch(`/api/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export thất bại");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `bao-cao-du-an-${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Có lỗi khi xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Danh sách dự án</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="border border-slate-300 text-slate-700 text-sm px-3 py-1.5 rounded-md hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            {exporting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Đang xuất...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Xuất Excel
              </>
            )}
          </button>
          <Link
            href="/projects/new"
            className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700"
          >
            + Thêm dự án
          </Link>
        </div>
      </div>

      {/* Export info banner khi đang filter */}
      {(search || status) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          Nút "Xuất Excel" sẽ xuất theo bộ lọc hiện tại
          {status && <span className="font-medium">· Trạng thái: {status}</span>}
          {search && <span className="font-medium">· Tìm kiếm: "{search}"</span>}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-slate-500 mb-1">
            Tìm kiếm (công ty, dự án, người liên hệ, email, SĐT)
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nhập từ khóa..."
            className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Trạng thái</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">Tất cả</option>
            {statuses.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Sắp xếp theo</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Thứ tự</label>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </div>
      </div>

      {/* Summary row */}
      <div className="text-sm text-slate-500">
        {loading ? "Đang tải..." : `${projects.length} dự án`}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="px-3 py-2 font-medium">Công ty</th>
              <th className="px-3 py-2 font-medium">Dự án</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium">Bước kế tiếp</th>
              <th className="px-3 py-2 font-medium">Người liên hệ chính</th>
              <th className="px-3 py-2 font-medium">SĐT</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Liên hệ lần đầu</th>
              <th className="px-3 py-2 font-medium">Ký hợp đồng</th>
              <th className="px-3 py-2 font-medium">Cập nhật gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-400">Đang tải...</td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-400">Không có dự án nào phù hợp.</td>
              </tr>
            ) : (
              projects.map((p) => {
                const primary = p.contacts.find((c) => c.isPrimary) || p.contacts[0];
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => (window.location.href = `/projects/${p.id}`)}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{p.companyName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{p.projectName}</td>
                    <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">{p.nextStep || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{primary ? primary.name : "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{primary?.phone || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{primary?.email || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.firstContactDate)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.contractSignedAt)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{formatDateTime(p.updatedAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
