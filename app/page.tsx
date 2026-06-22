"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { STATUS_LIST } from "@/lib/status";

type Project = {
  id: string;
  companyName: string;
  projectName: string;
  status: string;
  nextStep: string | null;
  updatedAt: string;
  contacts: { name: string; isPrimary: boolean }[];
};

type DashboardData = {
  total: number;
  byStatus: Record<string, number>;
  signedCount: number;
  followUp: Project[];
  noNextStep: Project[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="text-slate-500">Đang tải dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 mb-4">Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Tổng số dự án" value={data.total} highlight />
          <StatCard
            label="Đã ký hợp đồng"
            value={data.signedCount}
            color="text-green-700"
          />
          {STATUS_LIST.map((s) => (
            <StatCard key={s} label={s} value={data.byStatus[s] || 0} />
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Dự án đang cần follow-up">
          {data.followUp.length === 0 ? (
            <EmptyNote text="Không có dự án cần follow-up." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.followUp.map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Dự án chưa có bước kế tiếp">
          {data.noNextStep.length === 0 ? (
            <EmptyNote text="Tất cả dự án đều đã có bước kế tiếp." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.noNextStep.map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 bg-white ${
        highlight ? "border-slate-300" : "border-slate-200"
      }`}
    >
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color || "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-700">
        {title}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <div className="text-sm text-slate-400 px-2 py-4">{text}</div>;
}

function ProjectRow({ p }: { p: Project }) {
  const primary = p.contacts.find((c) => c.isPrimary) || p.contacts[0];
  return (
    <li>
      <Link
        href={`/projects/${p.id}`}
        className="flex items-center justify-between gap-3 px-2 py-2.5 hover:bg-slate-50 rounded-md"
      >
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-800 truncate">
            {p.companyName} — {p.projectName}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {primary ? primary.name : "Chưa có người liên hệ"} · Cập nhật:{" "}
            {formatDateTime(p.updatedAt)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={p.status} />
          <span className="text-xs text-slate-400">
            {p.nextStep || "—"}
          </span>
        </div>
      </Link>
    </li>
  );
}
