-- ============================================================================
-- Agenda sincronizada com o Google Agenda da nutricionista
-- Rode este arquivo inteiro no SQL Editor do Supabase (pode rodar mais de uma vez).
-- ============================================================================

-- 1) Conexão com o Google da nutricionista (uma única linha, id = 'nutri').
--    O refresh_token fica SÓ no servidor: a tabela é inacessível para anon/authenticated.
CREATE TABLE IF NOT EXISTS public.google_integracao (
  id             text PRIMARY KEY DEFAULT 'nutri' CHECK (id = 'nutri'),
  usuario_email  text NOT NULL,              -- e-mail da conta da nutri no sistema
  google_email   text,                       -- conta Google conectada (pode ser outra)
  refresh_token  text NOT NULL,
  access_token   text,
  expira_em      timestamptz,
  escopos        text,
  calendario_id  text NOT NULL DEFAULT 'primary',
  conectado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_integracao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.google_integracao FROM anon, authenticated;

-- 2) Ligação de cada consulta com o evento criado no Google Agenda
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS google_event_id        text;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS google_sincronizado_em timestamptz;
CREATE INDEX IF NOT EXISTS idx_agendamentos_google_event ON public.agendamentos (google_event_id)
  WHERE google_event_id IS NOT NULL;

-- 3) Dois pacientes não podem ficar com a mesma consulta (data + horário)
--    (a regra já existia no código; agora o banco também garante, mesmo com cliques simultâneos)
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_agendamentos_consulta_data_horario
    ON public.agendamentos (data, horario)
    WHERE tipo = 'consulta';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Já existem consultas duplicadas no mesmo dia e horário: corrija-as e rode este bloco de novo.';
END $$;
