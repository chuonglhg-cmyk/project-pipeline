"use client";

import { useEffect, useState } from "react";
import { DEFAULT_STATUSES, type StatusItem } from "@/lib/status";

// Hook dùng chung để lấy danh sách trạng thái từ DB.
// Fallback về DEFAULT_STATUSES nếu API lỗi.
export function useStatuses() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/statuses")
      .then((r) => r.json())
      .then((data) => {
        setStatuses(Array.isArray(data) ? data : DEFAULT_STATUSES);
      })
      .catch(() => setStatuses(DEFAULT_STATUSES))
      .finally(() => setLoading(false));
  }, []);

  function getNextStep(statusName: string): string | null {
    const found = statuses.find((s) => s.name === statusName);
    return found?.nextStep ?? null;
  }

  function getColor(statusName: string): string {
    const found = statuses.find((s) => s.name === statusName);
    return found?.color ?? "gray";
  }

  function isContractSigned(statusName: string): boolean {
    const found = statuses.find((s) => s.name === statusName);
    return found?.isContractSigned ?? false;
  }

  return { statuses, loading, getNextStep, getColor, isContractSigned };
}
