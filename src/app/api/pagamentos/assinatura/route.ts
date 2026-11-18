import { NextResponse } from "next/server";

/**
 * Checkout (Pix e cartão). O provedor de pagamento está sendo trocado: enquanto a integração nova
 * não entra no ar, o site não cobra ninguém e responde com um aviso claro.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "Os pagamentos estão sendo configurados e serão liberados em breve. Nenhuma cobrança foi feita.",
    },
    { status: 503 }
  );
}
