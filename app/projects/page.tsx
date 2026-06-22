"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/format";
import { STATUS_LIST } from "@/lib/status";

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
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Danh sách dự án</h1>
        <Link
          href="/projects/new"
          className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-slate-700"
        >
          + Thêm dự án
        </Link>
      </div>

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
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
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
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
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
                <td colSpan={10} className="px-3 py-6 text-center text-slate-400">
                  Đang tải...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-400">
                  Không có dự án nào phù hợp.
                </td>
              </tr>
            ) : (
              projects.map((p) => {
                const primary =
                  p.contacts.find((c) => c.isPrimary) || p.contacts[0];
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => (window.location.href = `/projects/${p.id}`)}
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                      {p.companyName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{p.projectName}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      {p.nextStep || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {primary ? primary.name : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {primary?.phone || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {primary?.email || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(p.firstContactDate)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(p.contractSignedAt)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDateTime(p.updatedAt)}
                    </td>
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
