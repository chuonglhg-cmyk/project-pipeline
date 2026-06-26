"use client";

import { COLOR_CLASS_MAP, STATUS_COLORS } from "@/lib/status";

export default function StatusBadge({
  status,
  color,
}: {
  status: string;
  color?: string;
}) {
  const cls = color
    ? (COLOR_CLASS_MAP[color] || COLOR_CLASS_MAP["gray"])
    : (STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-300");

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}
