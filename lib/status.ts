// Trạng thái mặc định dùng khi chưa có dữ liệu từ DB (fallback)
export const DEFAULT_STATUSES = [
  { name: "New",               nextStep: "Demo",           color: "gray",   order: 0, isContractSigned: false },
  { name: "Đã demo",           nextStep: "Gửi báo giá",    color: "blue",   order: 1, isContractSigned: false },
  { name: "Đã gửi báo giá",   nextStep: "Gửi hợp đồng",   color: "yellow", order: 2, isContractSigned: false },
  { name: "Đã gửi hợp đồng",  nextStep: "Ký hợp đồng",    color: "purple", order: 3, isContractSigned: false },
  { name: "Ký hợp đồng",      nextStep: "End",             color: "green",  order: 4, isContractSigned: true  },
  { name: "End",               nextStep: null,              color: "slate",  order: 5, isContractSigned: false },
];

export type StatusItem = {
  id?: string;
  name: string;
  nextStep: string | null;
  color: string;
  order: number;
  isContractSigned: boolean;
};

// Danh sách tên trạng thái mặc định (dùng khi chưa load từ DB)
export const STATUS_LIST = DEFAULT_STATUSES.map((s) => s.name);

// Map màu badge tailwind theo color key
export const COLOR_CLASS_MAP: Record<string, string> = {
  gray:   "bg-gray-100 text-gray-700 border-gray-300",
  blue:   "bg-blue-100 text-blue-700 border-blue-300",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
  purple: "bg-purple-100 text-purple-700 border-purple-300",
  green:  "bg-green-100 text-green-700 border-green-300",
  red:    "bg-red-100 text-red-700 border-red-300",
  slate:  "bg-slate-200 text-slate-600 border-slate-400",
  orange: "bg-orange-100 text-orange-700 border-orange-300",
  teal:   "bg-teal-100 text-teal-700 border-teal-300",
};

export const COLOR_OPTIONS = Object.keys(COLOR_CLASS_MAP);

// Lấy class badge từ danh sách status động (truyền vào từ API)
export function getBadgeClass(color: string): string {
  return COLOR_CLASS_MAP[color] || COLOR_CLASS_MAP["gray"];
}

// Dùng khi không có danh sách động (fallback)
export function getSuggestedNextStep(status: string): string | null {
  const found = DEFAULT_STATUSES.find((s) => s.name === status);
  return found ? found.nextStep ?? null : null;
}

export function isContractSignedStatus(status: string): boolean {
  const found = DEFAULT_STATUSES.find((s) => s.name === status);
  return found?.isContractSigned ?? false;
}

// Legacy compat - vẫn giữ STATUS_COLORS cho StatusBadge fallback
export const STATUS_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_STATUSES.map((s) => [s.name, COLOR_CLASS_MAP[s.color]])
);
