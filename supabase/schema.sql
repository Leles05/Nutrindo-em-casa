-- =========================================================================
-- ESQUEMA POSTGRESQL NUTRINDO EM CASA (SUPABASE)
-- Arquitetura de Produção Escalável para Alto Volume de Assinantes
-- =========================================================================

-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. TABELA PROFILES (Dados dos Responsáveis, Crianças e Assinatura)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nome TEXT,
    cpf TEXT,
    telefone TEXT,
    nome_crianca TEXT,
    idade_crianca TEXT,
    alimentos_conforto TEXT,
    principais_recusas TEXT,
    plano TEXT, -- 'mensal', 'trimestral', 'anual'
    status_assinatura TEXT DEFAULT 'AGUARDANDO_PAGAMENTO', -- 'ATIVO', 'AGUARDANDO_PAGAMENTO', 'CANCELADO', 'INADIMPLENTE'
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    notificacoes_email BOOLEAN DEFAULT true,
    anamnese_concluida BOOLEAN DEFAULT false,
    consulta_agendada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de Alta Performance para Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_customer ON public.profiles (asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_subscription ON public.profiles (asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status_assinatura ON public.profiles (status_assinatura);

-- -------------------------------------------------------------------------
-- 2. TABELA FATURAS (Histórico de Pagamentos e Cobranças Asaas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    asaas_payment_id TEXT UNIQUE,
    descricao TEXT,
    valor NUMERIC(10, 2),
    forma_pagamento TEXT, -- 'PIX', 'CREDIT_CARD', 'BOLETO'
    status TEXT DEFAULT 'Pendente', -- 'Pago', 'Pendente', 'Vencido', 'Cancelado'
    data_emissao TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para Faturas
CREATE INDEX IF NOT EXISTS idx_faturas_user_email ON public.faturas (user_email);
CREATE INDEX IF NOT EXISTS idx_faturas_asaas_payment ON public.faturas (asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_faturas_data_emissao ON public.faturas (data_emissao DESC);

-- -------------------------------------------------------------------------
-- 3. TABELA ANAMNESES (Respostas Completas das 56 Perguntas da Dra. Laís)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.anamneses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT UNIQUE NOT NULL,
    respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
    concluida BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice GIN para busca ágil dentro do payload JSONB da Anamnese
CREATE INDEX IF NOT EXISTS idx_anamneses_user_email ON public.anamneses (user_email);
CREATE INDEX IF NOT EXISTS idx_anamneses_respostas_gin ON public.anamneses USING gin (respostas);

-- -------------------------------------------------------------------------
-- 4. TABELA MENSAGENS_CHAT (Comunicação Direta com a Equipe Dra. Laís)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mensagens_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    remetente TEXT NOT NULL CHECK (remetente IN ('usuario', 'nutri')),
    texto TEXT NOT NULL,
    horario TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para Chat
CREATE INDEX IF NOT EXISTS idx_mensagens_user_email ON public.mensagens_chat (user_email);
CREATE INDEX IF NOT EXISTS idx_mensagens_created_at ON public.mensagens_chat (user_email, created_at ASC);

-- -------------------------------------------------------------------------
-- 5. TABELA DIARIO_REFEICOES (Registro dos Degraus da Escada Sensorial)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diario_refeicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    alimento TEXT NOT NULL,
    refeicao TEXT NOT NULL,
    degrau TEXT NOT NULL CHECK (degrau IN ('tolerou', 'cheirou', 'tocou', 'provou', 'comeu')),
    observacoes TEXT,
    foto TEXT,
    data_registro TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Suporte retroativo caso a tabela já tenha sido criada anteriormente sem a coluna foto:
ALTER TABLE public.diario_refeicoes ADD COLUMN IF NOT EXISTS foto TEXT;

-- Índices para Diário
CREATE INDEX IF NOT EXISTS idx_diario_user_email ON public.diario_refeicoes (user_email);
CREATE INDEX IF NOT EXISTS idx_diario_data_registro ON public.diario_refeicoes (user_email, data_registro DESC);

-- -------------------------------------------------------------------------
-- 6. TABELA AGENDAMENTOS (Consultas, Metas e Lembretes Sincronizados)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('consulta', 'meta', 'mentoria', 'lembrete')),
    data TEXT NOT NULL, -- Formato YYYY-MM-DD
    horario TEXT NOT NULL,
    plataforma TEXT DEFAULT 'Google Meet',
    link TEXT,
    concluido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para Agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_email ON public.agendamentos (user_email);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos (data ASC);

-- -------------------------------------------------------------------------
-- SEGURANÇA E ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Allow individual read profiles" ON public.profiles FOR SELECT USING (auth.jwt() ->> 'email' = email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual update profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Allow individual update profiles" ON public.profiles FOR UPDATE USING (auth.jwt() ->> 'email' = email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read faturas' AND tablename = 'faturas') THEN
        CREATE POLICY "Allow individual read faturas" ON public.faturas FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read/write anamneses' AND tablename = 'anamneses') THEN
        CREATE POLICY "Allow individual read/write anamneses" ON public.anamneses FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read/write chat' AND tablename = 'mensagens_chat') THEN
        CREATE POLICY "Allow individual read/write chat" ON public.mensagens_chat FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read/write diario' AND tablename = 'diario_refeicoes') THEN
        CREATE POLICY "Allow individual read/write diario" ON public.diario_refeicoes FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read/write agendamentos' AND tablename = 'agendamentos') THEN
        CREATE POLICY "Allow individual read/write agendamentos" ON public.agendamentos FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    END IF;
END $$;

-- -------------------------------------------------------------------------
-- 7. TABELA DEVOLUTIVAS_SEMANAIS (Parecer Clínico, Alimentos-Alvo e Metas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devolutivas_semanais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    semana_ref TEXT,
    parecer_clinico TEXT NOT NULL,
    alimentos_alvo JSONB DEFAULT '[]'::jsonb,
    metas_semana JSONB DEFAULT '[]'::jsonb,
    profissional TEXT DEFAULT 'Dra. Laís Leles • CRN-8 18878',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para Devolutivas Semanais
CREATE INDEX IF NOT EXISTS idx_devolutivas_user_email ON public.devolutivas_semanais (user_email);
CREATE INDEX IF NOT EXISTS idx_devolutivas_created_at ON public.devolutivas_semanais (user_email, created_at DESC);

-- -------------------------------------------------------------------------
-- 8. TABELA PRESCRICOES_PLANO (Prato Seguro, Orientações e Receitas Recomendadas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prescricoes_plano (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT UNIQUE NOT NULL,
    orientacao_prato_seguro TEXT,
    composicao_prato JSONB DEFAULT '{"conforto": 70, "ponte": 20, "desafio": 10}'::jsonb,
    refeicoes_estruturadas JSONB DEFAULT '[]'::jsonb,
    receitas_recomendadas_ids JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para Prescrições do Plano
CREATE INDEX IF NOT EXISTS idx_prescricoes_user_email ON public.prescricoes_plano (user_email);

-- -------------------------------------------------------------------------
-- 9. TABELA RESPOSTAS_RAPIDAS_NUTRI (Banco Clínico Personalizado da Nutricionista)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.respostas_rapidas_nutri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL,
    titulo TEXT NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para as Novas Tabelas
ALTER TABLE public.devolutivas_semanais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescricoes_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_rapidas_nutri ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read/write devolutivas' AND tablename = 'devolutivas_semanais') THEN
        CREATE POLICY "Allow individual read/write devolutivas" ON public.devolutivas_semanais FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow individual read/write prescricoes' AND tablename = 'prescricoes_plano') THEN
        CREATE POLICY "Allow individual read/write prescricoes" ON public.prescricoes_plano FOR ALL USING (auth.jwt() ->> 'email' = user_email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read all respostas rapidas' AND tablename = 'respostas_rapidas_nutri') THEN
        CREATE POLICY "Allow read all respostas rapidas" ON public.respostas_rapidas_nutri FOR ALL USING (true);
    END IF;
END $$;

