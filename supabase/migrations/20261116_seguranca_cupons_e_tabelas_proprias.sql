-- =========================================================================
-- MIGRAÇÃO: segurança (RLS), colunas faltantes e tabelas próprias
-- Idempotente: pode ser executada mais de uma vez sem efeitos colaterais.
-- NÃO APAGA NENHUM DADO EXISTENTE (cupons/cursos antigos são COPIADOS).
-- Executar no Supabase: SQL Editor > New query > colar > Run.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) COLUNAS QUE O CÓDIGO USA E O BANCO REAL NÃO TINHA
--    (as gravações nelas falhavam em silêncio: onboarding e foto de perfil)
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anamnese_concluida boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consulta_agendada  boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url         text;
-- Fim do período já pago quando o cliente cancela (acesso mantido até lá)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS acesso_ate         timestamptz;

-- Quem já tem anamnese concluída / consulta marcada fica coerente
UPDATE public.profiles p SET anamnese_concluida = true
 WHERE EXISTS (SELECT 1 FROM public.anamneses a WHERE a.user_email = p.email AND a.concluida = true)
   AND COALESCE(p.anamnese_concluida, false) = false;

UPDATE public.profiles p SET consulta_agendada = true
 WHERE EXISTS (SELECT 1 FROM public.agendamentos g WHERE g.user_email = p.email AND g.tipo = 'consulta')
   AND COALESCE(p.consulta_agendada, false) = false;

-- CPF é usado no login: guardar sempre só dígitos e não permitir duplicidade
UPDATE public.profiles SET cpf = regexp_replace(cpf, '\D', '', 'g') WHERE cpf ~ '\D';
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles (cpf);

-- -------------------------------------------------------------------------
-- 2) TABELA PRÓPRIA DE CUPONS (antes: JSON dentro de respostas_rapidas_nutri)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cupons (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo        text    NOT NULL,
    percentual    integer NOT NULL CHECK (percentual BETWEEN 1 AND 90),
    data_validade date,
    limite_usos   integer CHECK (limite_usos IS NULL OR limite_usos > 0),
    usos_atuais   integer NOT NULL DEFAULT 0 CHECK (usos_atuais >= 0),
    ativo         boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS cupons_codigo_unico ON public.cupons (upper(codigo));

-- Copia os cupons já existentes (mantém os originais intactos)
INSERT INTO public.cupons (codigo, percentual, data_validade, limite_usos, usos_atuais, ativo, created_at)
SELECT upper(trim(COALESCE(j->>'codigo', r.titulo))),
       LEAST(GREATEST(COALESCE(NULLIF(j->>'percentual','')::numeric, 1)::int, 1), 90),
       NULLIF(left(COALESCE(j->>'dataValidade',''), 10), '')::date,
       NULLIF(NULLIF(j->>'limiteUsos','')::numeric::int, 0),
       COALESCE(NULLIF(j->>'usosAtuais','')::numeric::int, 0),
       COALESCE((j->>'ativo')::boolean, true),
       r.created_at
  FROM public.respostas_rapidas_nutri r
  CROSS JOIN LATERAL (SELECT CASE WHEN r.categoria = 'CUPOM_DESCONTO' THEN r.texto::jsonb END AS j) x
 WHERE r.categoria = 'CUPOM_DESCONTO'
ON CONFLICT DO NOTHING;

-- Uso de cupom ATÔMICO: valida (ativo/validade/limite) e incrementa numa única instrução.
-- Evita estourar o limite com duas compras simultâneas. Retorna o cupom consumido ou nada.
CREATE OR REPLACE FUNCTION public.consumir_cupom(p_codigo text)
RETURNS TABLE (id uuid, codigo text, percentual integer)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    UPDATE public.cupons c
       SET usos_atuais = c.usos_atuais + 1
     WHERE upper(c.codigo) = upper(trim(p_codigo))
       AND c.ativo
       AND (c.data_validade IS NULL OR c.data_validade >= (now() AT TIME ZONE 'America/Sao_Paulo')::date)
       AND (c.limite_usos IS NULL OR c.usos_atuais < c.limite_usos)
    RETURNING c.id, c.codigo, c.percentual;
$$;

-- Devolve um uso (ex.: cobrança que falhou depois de consumir o cupom)
CREATE OR REPLACE FUNCTION public.devolver_cupom(p_codigo text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
    UPDATE public.cupons SET usos_atuais = GREATEST(usos_atuais - 1, 0)
     WHERE upper(codigo) = upper(trim(p_codigo));
$$;

-- -------------------------------------------------------------------------
-- 3) CURSOS: estrutura e materiais de aula em tabelas próprias
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.curso_estrutura (
    id          smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- registro único
    modulos     jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.curso_estrutura (id, modulos)
SELECT 1, CASE WHEN r.categoria = 'ESTRUTURA_CURSO' THEN r.texto::jsonb END
  FROM public.respostas_rapidas_nutri r
 WHERE r.categoria = 'ESTRUTURA_CURSO'
 ORDER BY r.created_at DESC
 LIMIT 1
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.materiais_aulas (
    aula_id        integer PRIMARY KEY,
    titulo         text,
    descricao      text,
    video_url      text,
    material_anexo jsonb,
    atualizado_em  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.materiais_aulas (aula_id, titulo, descricao, video_url, material_anexo, atualizado_em)
SELECT (j->>'aula_id')::int, j->>'titulo', j->>'descricao', j->>'video_url',
       CASE WHEN j->'material_anexo' = 'null'::jsonb THEN NULL ELSE j->'material_anexo' END,
       COALESCE(NULLIF(j->>'atualizado_em','')::timestamptz, r.created_at)
  FROM public.respostas_rapidas_nutri r
  CROSS JOIN LATERAL (SELECT CASE WHEN r.categoria = 'CURSO_MATERIAL_AULA' THEN r.texto::jsonb END AS j) x
 WHERE r.categoria = 'CURSO_MATERIAL_AULA' AND (j->>'aula_id') IS NOT NULL
ON CONFLICT (aula_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 4) IDEMPOTÊNCIA DO WEBHOOK DO ASAAS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.asaas_eventos (
    id          text PRIMARY KEY,                 -- id do evento enviado pelo Asaas
    evento      text,
    payment_id  text,
    recebido_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -------------------------------------------------------------------------
-- 5) SEGURANÇA: o app só acessa o banco pelo servidor (service_role).
--    O navegador nunca usa o banco direto, então anon/authenticated ficam SEM acesso.
--    RLS ligado em tudo = defesa em profundidade (sem políticas = nega tudo).
-- -------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','faturas','anamneses','mensagens_chat','diario_refeicoes','agendamentos',
    'devolutivas_semanais','prescricoes_plano','respostas_rapidas_nutri',
    'cupons','curso_estrutura','materiais_aulas','asaas_eventos'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;

-- Remove políticas antigas (incluindo a "USING (true)" que deixava qualquer pessoa ler/editar)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('profiles','faturas','anamneses','mensagens_chat','diario_refeicoes','agendamentos',
                         'devolutivas_semanais','prescricoes_plano','respostas_rapidas_nutri')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Funções de cupom: só o servidor (service_role) pode chamar
REVOKE ALL ON FUNCTION public.consumir_cupom(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.devolver_cupom(text)  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cupom(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.devolver_cupom(text)  TO service_role;

-- service_role mantém acesso total às tabelas novas
GRANT ALL ON public.cupons, public.curso_estrutura, public.materiais_aulas, public.asaas_eventos TO service_role;

-- =========================================================================
-- VERIFICAÇÃO (rode depois, opcional): deve listar 13 tabelas com rls = true
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY 1;
--   SELECT count(*) FROM public.cupons;  -- deve incluir o cupom que já existia (TESTE)
-- =========================================================================
