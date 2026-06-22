import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Quản lý Dự án / Khách hàng",
  description: "Pipeline quản lý dự án từ liên hệ đến ký hợp đồng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                <Link href="/" className="font-semibold text-slate-800 text-lg">
                  📋 Project Pipeline
                </Link>
                <nav className="flex gap-4 text-sm font-medium">
                  <Link
                    href="/"
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Danh sách dự án
                  </Link>
                  <Link
                    href="/projects/new"
                    className="bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700"
                  >
                    + Thêm dự án
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
