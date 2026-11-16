-- =========================================================================
-- MIGRAÇÃO: parcelamento no cartão + renovação automática
-- Idempotente e SEM apagar dados. Executar no SQL Editor do Supabase.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) Campos de renovação no perfil (nenhum é sensível)
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parcelas                  integer DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS asaas_installment_id      text;    -- compra parcelada atual
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS proxima_cobranca          date;    -- fim do período = data da renovação
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS renovacao_automatica      boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS renovacao_falhas          integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS renovacao_ultima_tentativa date;   -- no máx. 1 tentativa por dia
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS renovacao_aviso_ciclo     date;    -- ciclo (proxima_cobranca) já avisado por e-mail

CREATE INDEX IF NOT EXISTS idx_profiles_installment ON public.profiles (asaas_installment_id);
CREATE INDEX IF NOT EXISTS idx_profiles_proxima_cobranca ON public.profiles (proxima_cobranca) WHERE renovacao_automatica;

-- -------------------------------------------------------------------------
-- 2) Cartão salvo para a renovação — TABELA SEPARADA e trancada.
--    O token só funciona com a chave de API do Asaas, mas mesmo assim nunca deve
--    trafegar para o navegador (várias rotas devolvem o perfil inteiro).
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cartoes_salvos (
    user_email  text PRIMARY KEY,
    token       text NOT NULL,          -- creditCardToken do Asaas (não é o número do cartão)
    ultimos4    text,
    bandeira    text,
    ip_compra   text,                   -- IP do comprador na 1ª compra (o Asaas exige remoteIp)
    updated_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -------------------------------------------------------------------------
-- 3) Faturas: uma linha por parcela
-- -------------------------------------------------------------------------
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS parcela_numero         integer;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS parcelas_total         integer;
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS asaas_installment_id   text;
CREATE INDEX IF NOT EXISTS idx_faturas_installment ON public.faturas (asaas_installment_id);

-- -------------------------------------------------------------------------
-- 4) Segurança: só o servidor (service_role) acessa
-- -------------------------------------------------------------------------
ALTER TABLE public.cartoes_salvos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cartoes_salvos FROM anon, authenticated;
GRANT ALL ON public.cartoes_salvos TO service_role;

-- =========================================================================
-- VERIFICAÇÃO (opcional):
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name='profiles' AND column_name IN ('parcelas','proxima_cobranca','renovacao_automatica');
-- =========================================================================
