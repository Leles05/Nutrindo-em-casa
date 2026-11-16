import { NextResponse } from "next/server";
import { autenticar, naoAutenticado } from "@/lib/auth";

/** Confirma no servidor quem é o usuário da sessão e qual o papel real dele. */
export async function GET(request: Request) {
  const ctx = await autenticar(request);
  if (!ctx) return naoAutenticado();
  return NextResponse.json({ success: true, email: ctx.email, role: ctx.role });
}
