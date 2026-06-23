import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

// GET /api/export?status=...&search=...
// Xuất danh sách dự án ra file Excel (.xlsx)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() || "";
  const search = searchParams.get("search")?.trim() || "";

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { projectName: { contains: search, mode: "insensitive" } },
      { contacts: { some: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      notes: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // ---------------------------------------------------------------
  // Build Excel workbook
  // ---------------------------------------------------------------
  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Pipeline";
  wb.created = new Date();

  // ── Sheet 1: Danh sách dự án ──────────────────────────────────
  const ws = wb.addWorksheet("Danh sách dự án");

  // Tiêu đề report
  ws.mergeCells("A1:L1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "BÁO CÁO DANH SÁCH DỰ ÁN / KHÁCH HÀNG";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:L2");
  const subCell = ws.getCell("A2");
  subCell.value = `Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}  |  Tổng số: ${projects.length} dự án${status ? "  |  Trạng thái: " + status : ""}`;
  subCell.font = { size: 10, color: { argb: "FF666666" } };
  subCell.alignment = { horizontal: "center" };
  ws.getRow(2).height = 18;

  ws.addRow([]); // dòng trống

  // Header
  const headers = [
    { header: "STT", key: "stt", width: 5 },
    { header: "Tên công ty", key: "company", width: 22 },
    { header: "Tên dự án", key: "project", width: 28 },
    { header: "Trạng thái", key: "status", width: 18 },
    { header: "Bước kế tiếp", key: "next", width: 18 },
    { header: "Người liên hệ chính", key: "contact", width: 22 },
    { header: "Chức vụ", key: "position", width: 16 },
    { header: "Số điện thoại", key: "phone", width: 14 },
    { header: "Email", key: "email", width: 26 },
    { header: "Liên hệ lần đầu", key: "first", width: 16 },
    { header: "Ký hợp đồng", key: "signed", width: 16 },
    { header: "Cập nhật gần nhất", key: "updated", width: 18 },
  ];

  ws.columns = headers;

  const headerRow = ws.getRow(4);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF334155" } },
      bottom: { style: "thin", color: { argb: "FF334155" } },
      left: { style: "thin", color: { argb: "FF334155" } },
      right: { style: "thin", color: { argb: "FF334155" } },
    };
  });
  headerRow.height = 28;

  // Status color map
  const statusColors: Record<string, string> = {
    "New": "FFF1EFE8",
    "Đã demo": "FFE6F1FB",
    "Đã gửi báo giá": "FFFAEEDA",
    "Đã gửi hợp đồng": "FFEEEDFE",
    "Ký hợp đồng": "FFEAF3DE",
    "End": "FFE2E8F0",
  };

  const fmt = (d: Date | string | null | undefined) => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("vi-VN");
  };

  projects.forEach((p, i) => {
    const primary = p.contacts.find((c) => c.isPrimary) || p.contacts[0];
    const rowData = {
      stt: i + 1,
      company: p.companyName,
      project: p.projectName,
      status: p.status,
      next: p.nextStep || "",
      contact: primary?.name || "",
      position: primary?.position || "",
      phone: primary?.phone || "",
      email: primary?.email || "",
      first: fmt(p.firstContactDate),
      signed: fmt(p.contractSignedAt),
      updated: fmt(p.updatedAt),
    };

    const row = ws.addRow(rowData);
    const bgColor = statusColors[p.status] || "FFFFFFFF";

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? bgColor : "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", wrapText: false };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      // STT center
      if (colNum === 1) cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    row.height = 22;
  });

  // Freeze header row
  ws.views = [{ state: "frozen", ySplit: 4, activeCell: "A5" }];

  // ── Sheet 2: Thống kê theo trạng thái ────────────────────────
  const ws2 = wb.addWorksheet("Thống kê");

  ws2.columns = [
    { header: "", key: "label", width: 25 },
    { header: "", key: "value", width: 12 },
  ];

  const addStatHeader = (text: string) => {
    const r = ws2.addRow([text]);
    r.getCell(1).font = { bold: true, size: 12 };
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    r.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws2.mergeCells(`A${r.number}:B${r.number}`);
    r.height = 24;
  };

  const addStatRow = (label: string, value: number | string, bgColor = "FFFFFFFF") => {
    const r = ws2.addRow([label, value]);
    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
    r.getCell(2).alignment = { horizontal: "center" };
    r.height = 20;
  };

  ws2.addRow([]);
  addStatHeader("TỔNG QUAN");
  addStatRow("Tổng số dự án", projects.length, "FFF8FAFC");
  addStatRow("Đã ký hợp đồng", projects.filter(p => p.status === "Ký hợp đồng").length, "FFEAF3DE");
  addStatRow("Đang follow-up", projects.filter(p => p.status !== "End").length, "FFFAEEDA");

  ws2.addRow([]);
  addStatHeader("THEO TRẠNG THÁI");

  const statusList = ["New", "Đã demo", "Đã gửi báo giá", "Đã gửi hợp đồng", "Ký hợp đồng", "End"];
  statusList.forEach(s => {
    const count = projects.filter(p => p.status === s).length;
    addStatRow(s, count, statusColors[s] || "FFFFFFFF");
  });

  // ── Sheet 3: Chi tiết ghi chú ─────────────────────────────────
  const ws3 = wb.addWorksheet("Ghi chú dự án");
  ws3.columns = [
    { header: "Công ty", key: "company", width: 22 },
    { header: "Dự án", key: "project", width: 28 },
    { header: "Trạng thái", key: "status", width: 18 },
    { header: "Nội dung ghi chú", key: "note", width: 60 },
    { header: "Thời gian ghi chú", key: "time", width: 18 },
  ];

  const noteHeaderRow = ws3.getRow(1);
  noteHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  noteHeaderRow.height = 26;

  projects.forEach((p) => {
    p.notes.forEach((n) => {
      const r = ws3.addRow({
        company: p.companyName,
        project: p.projectName,
        status: p.status,
        note: n.content,
        time: fmt(n.createdAt),
      });
      r.getCell(4).alignment = { wrapText: true, vertical: "top" };
      r.height = 36;
    });
  });

  ws3.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

  // ── Serialize to buffer ───────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `bao-cao-du-an-${dateStr}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
