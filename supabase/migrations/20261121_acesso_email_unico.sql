-- Evita e-mails de boas-vindas repetidos (checkout + avisos do Asaas chegando juntos).
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS acesso_enviado_em timestamptz;
