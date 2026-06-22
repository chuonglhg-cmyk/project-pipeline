// Trạng thái dự án theo flow:
// New -> Demo -> Gửi báo giá -> Gửi hợp đồng -> Ký hợp đồng -> End

export const STATUS_LIST = [
  "New",
  "Đã demo",
  "Đã gửi báo giá",
  "Đã gửi hợp đồng",
  "Ký hợp đồng",
  "End",
] as const;

export type ProjectStatus = (typeof STATUS_LIST)[number];

// Bảng quy tắc: trạng thái hiện tại -> bước kế tiếp gợi ý
export const NEXT_STEP_MAP: Record<ProjectStatus, string | null> = {
  New: "Demo",
  "Đã demo": "Gửi báo giá",
  "Đã gửi báo giá": "Gửi hợp đồng",
  "Đã gửi hợp đồng": "Ký hợp đồng",
  "Ký hợp đồng": "End",
  End: null,
};

// Trả về bước kế tiếp gợi ý dựa trên trạng thái.
// Nếu trạng thái không hợp lệ / không nằm trong danh sách, trả về null.
export function getSuggestedNextStep(status: string): string | null {
  if (Object.prototype.hasOwnProperty.call(NEXT_STEP_MAP, status)) {
    return NEXT_STEP_MAP[status as ProjectStatus];
  }
  return null;
}

// Trạng thái nào cần gợi ý nhập "Thời gian ký hợp đồng"
export function isContractSignedStatus(status: string): boolean {
  return status === "Ký hợp đồng";
}

// Badge color theo trạng thái - dùng cho UI
export const STATUS_COLORS: Record<string, string> = {
  New: "bg-gray-100 text-gray-700 border-gray-300",
  "Đã demo": "bg-blue-100 text-blue-700 border-blue-300",
  "Đã gửi báo giá": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Đã gửi hợp đồng": "bg-purple-100 text-purple-700 border-purple-300",
  "Ký hợp đồng": "bg-green-100 text-green-700 border-green-300",
  End: "bg-slate-200 text-slate-600 border-slate-400",
};
