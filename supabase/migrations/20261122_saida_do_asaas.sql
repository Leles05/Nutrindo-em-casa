-- Saída definitiva do Asaas: nomes neutros e remoção do que só existia por causa dele.
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
-- Atenção: renomeia colunas usadas pelo código. Aplique junto com o deploy desta versão.

DO $$
BEGIN
  -- perfis
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='asaas_customer_id') THEN
    ALTER TABLE public.profiles RENAME COLUMN asaas_customer_id TO gateway_cliente_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='asaas_subscription_id') THEN
    ALTER TABLE public.profiles RENAME COLUMN asaas_subscription_id TO gateway_assinatura_id;
  END IF;
  -- faturas
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='faturas' AND column_name='asaas_payment_id') THEN
    ALTER TABLE public.faturas RENAME COLUMN asaas_payment_id TO gateway_pagamento_id;
  END IF;
  -- eventos de webhook já processados (evita processar o mesmo aviso duas vezes)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='asaas_eventos') THEN
    ALTER TABLE public.asaas_eventos RENAME TO gateway_eventos;
  END IF;
END $$;

-- Parcelamento por fatura e cartão salvo eram específicos do Asaas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS asaas_installment_id;
ALTER TABLE public.faturas  DROP COLUMN IF EXISTS asaas_installment_id;
DROP TABLE IF EXISTS public.cartoes_salvos;

-- Índices com nomes neutros (só estética)
ALTER INDEX IF EXISTS public.idx_profiles_asaas_customer     RENAME TO idx_profiles_gateway_cliente;
ALTER INDEX IF EXISTS public.idx_profiles_asaas_subscription RENAME TO idx_profiles_gateway_assinatura;
ALTER INDEX IF EXISTS public.idx_faturas_asaas_payment       RENAME TO idx_faturas_gateway_pagamento;
DROP INDEX IF EXISTS public.idx_profiles_installment;
DROP INDEX IF EXISTS public.idx_faturas_installment;
