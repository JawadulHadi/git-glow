CREATE TABLE public.studio_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash text NOT NULL,
  page text NOT NULL CHECK (page IN ('readme', 'code-report')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_hash, page)
);

GRANT ALL ON public.studio_visits TO service_role;

ALTER TABLE public.studio_visits ENABLE ROW LEVEL SECURITY;