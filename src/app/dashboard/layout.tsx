"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, PlayCircle, Calendar, MessageCircle, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Função para identificar a página atual e definir a cor
  const navItems = [
    { name: "Início", href: "/dashboard", icon: Home, color: "hover:bg-[#4C6C54] hover:text-white", activeColor: "bg-[#4C6C54] text-white" },
    { name: "Cursos", href: "/dashboard/cursos", icon: PlayCircle, color: "hover:bg-[#EB6D57] hover:text-white", activeColor: "bg-[#EB6D57] text-white" },
    { name: "Calendário", href: "/dashboard/calendario", icon: Calendar, color: "hover:bg-[#2A546D] hover:text-white", activeColor: "bg-[#2A546D] text-white" },
    { name: "Chat", href: "/dashboard/chat", icon: MessageCircle, color: "hover:bg-[#EAA345] hover:text-white", activeColor: "bg-[#EAA345] text-white" },
  ];

  return (
    <div className="flex h-screen bg-[#F0EAE1] overflow-hidden font-sans text-slate-800">
      
      {/* Barra Lateral (Sidebar) - Foco em Desktop */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Logo Menor no Topo */}
        <div className="h-24 flex items-center justify-center border-b border-slate-100 p-4">
          <Link href="/dashboard" className="relative h-full w-full max-w-[140px] block hover:opacity-80 transition-opacity">
            <Image 
              src="/logo-transparente.png" 
              alt="Nutrindo em Casa" 
              fill 
              className="object-contain" 
              priority 
            />
          </Link>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive ? item.activeColor : `text-slate-500 bg-transparent ${item.color}`
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Botão de Sair no Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-100">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors font-medium">
            <LogOut className="h-5 w-5" />
            Sair
          </Link>
        </div>
      </aside>

      {/* Conteúdo Principal (Onde as telas vão renderizar) */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}