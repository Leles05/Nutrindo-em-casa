import { redirect } from "next/navigation";

export default function Modulo1RedirectPage() {
  // Redireciona para o player de streaming de aulas existente no dashboard
  redirect("/dashboard/cursos");
}
