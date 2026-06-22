import { STATUS_COLORS } from "@/lib/status";

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-300";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${color}`}
    >
      {status}
    </span>
  );
}
