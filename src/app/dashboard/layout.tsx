"use client";

import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F0EAE1] overflow-hidden font-sans text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 lg:p-5">
        {children}
      </main>
    </div>
  );
}