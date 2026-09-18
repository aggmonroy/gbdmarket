ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quote_price_provider numeric,
  ADD COLUMN IF NOT EXISTS quote_price_label numeric,
  ADD COLUMN IF NOT EXISTS quote_freight numeric,
  ADD COLUMN IF NOT EXISTS quote_installation numeric,
  ADD COLUMN IF NOT EXISTS quote_prices_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS products_quote_prices_updated_at_idx
  ON public.products (quote_prices_updated_at)
  WHERE quote_prices_updated_at IS NOT NULL;