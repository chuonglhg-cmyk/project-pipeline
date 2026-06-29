import { Suspense } from "react";
import SetupPasswordForm from "./SetupPasswordForm";

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-slate-400 text-sm">Đang tải...</div></div>}>
      <SetupPasswordForm />
    </Suspense>
  );
}
