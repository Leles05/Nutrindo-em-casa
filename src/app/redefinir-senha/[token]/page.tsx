"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rota antiga de redefinição por token próprio. A redefinição segura agora usa o link oficial do Supabase,
 * que abre /criar-senha com a sessão do e-mail. Mantida apenas para redirecionar links antigos.
 */
export default function RedefinirSenhaLegada() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/esqueci-senha");
  }, [router]);
  return null;
}
