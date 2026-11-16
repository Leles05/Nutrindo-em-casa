-- =========================================================================
-- MIGRAÇÃO: aceite dos Termos de Uso / consentimento LGPD (com trilha de auditoria)
-- Idempotente e SEM apagar dados. Executar no SQL Editor do Supabase.
-- =========================================================================

-- 1) Situação atual do aceite no perfil (consulta rápida a cada login)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS termos_versao          text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS termos_aceito_em       timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consentimento_saude_em timestamptz;

-- 2) Trilha de auditoria: cada aceite vira uma linha que NUNCA é alterada (prova do consentimento)
CREATE TABLE IF NOT EXISTS public.aceites_termos (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email            text    NOT NULL,
    versao                text    NOT NULL,            -- versão dos Termos/Política aceita
    termos                boolean NOT NULL DEFAULT true,
    privacidade           boolean NOT NULL DEFAULT true,
    consentimento_saude   boolean NOT NULL DEFAULT false,  -- dados de saúde da criança (LGPD art. 11 e 14)
    renovacao_automatica  boolean NOT NULL DEFAULT false,  -- ciente da renovação automática no cartão
    origem                text    NOT NULL,            -- 'checkout' ou 'app'
    ip                    text,
    user_agent            text,
    created_at            timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_aceites_email ON public.aceites_termos (user_email, created_at DESC);

-- 3) Segurança: só o servidor (service_role) acessa
ALTER TABLE public.aceites_termos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.aceites_termos FROM anon, authenticated;
GRANT ALL ON public.aceites_termos TO service_role;
