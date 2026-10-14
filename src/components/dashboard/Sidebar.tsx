"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Utensils, PlayCircle, Calendar, MessageCircle, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Início",
      href: "/dashboard",
      icon: Home,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname === "/dashboard"
    },
    {
      name: "Diário",
      href: "/dashboard/diario",
      icon: Utensils,
      color: "hover:bg-[#3D6B50] hover:text-white",
      activeColor: "bg-[#3D6B50] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/diario")
    },
    {
      name: "Cursos",
      href: "/cursos",
      icon: PlayCircle,
      color: "hover:bg-[#EB6D57] hover:text-white",
      activeColor: "bg-[#EB6D57] text-white shadow-xs",
      isActive: pathname === "/cursos" || pathname?.startsWith("/cursos") || pathname?.startsWith("/dashboard/cursos")
    },
    {
      name: "Calendário",
      href: "/dashboard/calendario",
      icon: Calendar,
      color: "hover:bg-[#2A546D] hover:text-white",
      activeColor: "bg-[#2A546D] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/calendario")
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageCircle,
      color: "hover:bg-[#EAA345] hover:text-white",
      activeColor: "bg-[#EAA345] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/chat")
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: Settings,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/configuracoes")
    },
  ];

  return (
    <aside className="w-52 bg-white border-r border-slate-200 flex flex-col shadow-xs shrink-0 z-20">
      <div className="h-16 flex items-center justify-center border-b border-slate-100 px-3">
        <Link href="/dashboard" className="relative h-10 w-28 block hover:opacity-85 transition-opacity">
          <Image 
            src="/logo-transparente.png" 
            alt="Nutrindo em Casa" 
            fill 
            className="object-contain" 
            priority 
          />
        </Link>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
              item.isActive ? item.activeColor : `text-slate-500 bg-transparent ${item.color}`
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-bold"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
