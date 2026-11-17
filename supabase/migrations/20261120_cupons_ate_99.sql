-- Cupons passam a poder ter de 1% até 99% de desconto (antes o limite era 90%).
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'public.cupons'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%percentual%'
  LOOP
    EXECUTE format('ALTER TABLE public.cupons DROP CONSTRAINT %I', c.conname);
  END LOOP;
  ALTER TABLE public.cupons
    ADD CONSTRAINT cupons_percentual_check CHECK (percentual BETWEEN 1 AND 99);
END $$;
